from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import Utilisateur
from app.models.concentrateur import Concentrateur
from app.models.action import HistoriqueAction

router = APIRouter()


class ActionCreate(BaseModel):
    concentrateur_id: str
    type_action: str
    nouvel_etat: Optional[str] = None
    nouvelle_affectation: Optional[str] = None
    poste_id: Optional[int] = None
    commentaire: Optional[str] = None
    photo: Optional[str] = None
    scan_qr: bool = False


class ConcentrateurInfo(BaseModel):
    numero_serie: str
    modele: Optional[str] = None
    operateur: Optional[str] = None
    
    class Config:
        from_attributes = True


class ActionResponse(BaseModel):
    id_action: int
    type_action: str
    date_action: datetime
    ancien_etat: Optional[str] = None
    nouvel_etat: Optional[str] = None
    ancienne_affectation: Optional[str] = None
    nouvelle_affectation: Optional[str] = None
    commentaire: Optional[str] = None
    scan_qr: bool
    photo: Optional[str] = None
    user_id: int
    concentrateur_id: Optional[str] = None
    concentrateur: Optional[ConcentrateurInfo] = None

    class Config:
        from_attributes = True


@router.post("", response_model=ActionResponse, status_code=status.HTTP_201_CREATED)
async def create_action(
    data: ActionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Créer une nouvelle action sur un concentrateur.
    """
    # Vérifier que le concentrateur existe
    result = await db.execute(
        select(Concentrateur).where(Concentrateur.numero_serie == data.concentrateur_id)
    )
    concentrateur = result.scalar_one_or_none()
    
    if not concentrateur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Concentrateur {data.concentrateur_id} non trouvé"
        )
    
    # Sauvegarder les anciennes valeurs
    ancien_etat = concentrateur.etat
    ancienne_affectation = concentrateur.affectation
    
    # Déterminer le nouvel état et affectation selon le type d'action
    nouvel_etat = data.nouvel_etat
    nouvelle_affectation = data.nouvelle_affectation
    
    if data.type_action == 'pose':
        nouvel_etat = 'pose'
        nouvelle_affectation = current_user.base_affectee
    elif data.type_action == 'depose':
        nouvel_etat = 'en_stock'
        nouvelle_affectation = 'Labo'
    elif data.type_action == 'reception_magasin':
        nouvel_etat = 'en_stock'
        nouvelle_affectation = 'Magasin'
    elif data.type_action == 'transfert_bo':
        nouvel_etat = 'en_stock'
    elif data.type_action == 'mise_au_rebut':
        nouvel_etat = 'hs'
    
    # Mettre à jour le concentrateur
    if nouvel_etat:
        concentrateur.etat = nouvel_etat
    if nouvelle_affectation:
        concentrateur.affectation = nouvelle_affectation
    if data.poste_id:
        concentrateur.poste_id = data.poste_id
    if data.type_action == 'pose':
        concentrateur.date_pose = datetime.utcnow()
    
    concentrateur.date_dernier_etat = datetime.utcnow()
    concentrateur.commentaire = data.commentaire
    
    # Créer l'action
    action = HistoriqueAction(
        type_action=data.type_action,
        ancien_etat=ancien_etat,
        nouvel_etat=nouvel_etat or ancien_etat,
        ancienne_affectation=ancienne_affectation,
        nouvelle_affectation=nouvelle_affectation or ancienne_affectation,
        commentaire=data.commentaire,
        photo=data.photo,
        scan_qr=data.scan_qr,
        user_id=current_user.id_utilisateur,
        concentrateur_id=data.concentrateur_id,
        poste_id=data.poste_id
    )
    
    db.add(action)
    await db.commit()
    await db.refresh(action)
    
    return action


@router.get("/me")
async def get_my_actions(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Liste des actions de l'utilisateur connecté avec infos concentrateur.
    """
    # Compter le total
    count_query = select(func.count()).select_from(HistoriqueAction).where(
        HistoriqueAction.user_id == current_user.id_utilisateur
    )
    result = await db.execute(count_query)
    total = result.scalar()
    
    # Récupérer les actions
    offset = (page - 1) * limit
    query = select(HistoriqueAction).where(
        HistoriqueAction.user_id == current_user.id_utilisateur
    ).order_by(HistoriqueAction.date_action.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    actions = result.scalars().all()
    
    # Enrichir avec les infos concentrateur
    actions_with_concentrateur = []
    for action in actions:
        action_dict = {
            "id_action": action.id_action,
            "type_action": action.type_action,
            "date_action": action.date_action,
            "ancien_etat": action.ancien_etat,
            "nouvel_etat": action.nouvel_etat,
            "ancienne_affectation": action.ancienne_affectation,
            "nouvelle_affectation": action.nouvelle_affectation,
            "commentaire": action.commentaire,
            "scan_qr": action.scan_qr,
            "photo": action.photo,
            "user_id": action.user_id,
            "concentrateur_id": action.concentrateur_id,
            "concentrateur": None
        }
        
        if action.concentrateur_id:
            conc_result = await db.execute(
                select(Concentrateur).where(Concentrateur.numero_serie == action.concentrateur_id)
            )
            concentrateur = conc_result.scalar_one_or_none()
            if concentrateur:
                action_dict["concentrateur"] = {
                    "numero_serie": concentrateur.numero_serie,
                    "modele": concentrateur.modele,
                    "operateur": concentrateur.operateur
                }
        
        actions_with_concentrateur.append(action_dict)
    
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "data": actions_with_concentrateur,
        "total": total,
        "page": page,
        "total_pages": total_pages
    }


@router.get("")
async def get_actions(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    concentrateur_id: Optional[str] = None,
    user_id: Optional[int] = None,
    type_action: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Liste des actions avec filtres.
    """
    query = select(HistoriqueAction)
    count_query = select(func.count()).select_from(HistoriqueAction)
    
    conditions = []
    if concentrateur_id:
        conditions.append(HistoriqueAction.concentrateur_id == concentrateur_id)
    if user_id:
        conditions.append(HistoriqueAction.user_id == user_id)
    if type_action:
        conditions.append(HistoriqueAction.type_action == type_action)
    
    for condition in conditions:
        query = query.where(condition)
        count_query = count_query.where(condition)
    
    result = await db.execute(count_query)
    total = result.scalar()
    
    offset = (page - 1) * limit
    query = query.order_by(HistoriqueAction.date_action.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    actions = result.scalars().all()
    
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "data": actions,
        "total": total,
        "page": page,
        "total_pages": total_pages
    }
