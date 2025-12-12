from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import Utilisateur
from app.models.commande import CommandeBo
from app.models.carton import Carton
from app.models.concentrateur import Concentrateur
from app.models.action import HistoriqueAction

router = APIRouter()


# Schemas
class CommandeCreate(BaseModel):
    bo_demandeur: str
    quantite: int
    operateur_souhaite: Optional[str] = None


class CommandeResponse(BaseModel):
    id_commande: int
    bo_demandeur: str
    quantite: int
    operateur_souhaite: Optional[str]
    statut_commande: str
    user_id: int
    date_commande: datetime
    date_validation: Optional[datetime]
    date_livraison: Optional[datetime]
    demandeur_nom: Optional[str] = None
    demandeur_prenom: Optional[str] = None

    class Config:
        from_attributes = True


class ValidationTransfertRequest(BaseModel):
    numero_carton: str


# Endpoints
@router.get("", response_model=List[CommandeResponse])
async def get_commandes(
    statut: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Liste des commandes/demandes de transfert.
    - Admin/Magasin: toutes les commandes
    - Autres: uniquement les commandes de leur BO
    """
    query = select(CommandeBo).order_by(CommandeBo.date_commande.desc())
    
    # Filtrer par statut si spécifié
    if statut:
        query = query.where(CommandeBo.statut_commande == statut)
    
    # Filtrer par BO si pas admin/magasin
    if current_user.role not in ['admin', 'magasin']:
        query = query.where(CommandeBo.bo_demandeur == current_user.base_affectee)
    
    result = await db.execute(query)
    commandes = result.scalars().all()
    
    # Enrichir avec les infos utilisateur
    response = []
    for commande in commandes:
        user_result = await db.execute(
            select(Utilisateur).where(Utilisateur.id_utilisateur == commande.user_id)
        )
        user = user_result.scalar_one_or_none()
        
        response.append(CommandeResponse(
            id_commande=commande.id_commande,
            bo_demandeur=commande.bo_demandeur,
            quantite=commande.quantite,
            operateur_souhaite=commande.operateur_souhaite,
            statut_commande=commande.statut_commande,
            user_id=commande.user_id,
            date_commande=commande.date_commande,
            date_validation=commande.date_validation,
            date_livraison=commande.date_livraison,
            demandeur_nom=user.nom if user else None,
            demandeur_prenom=user.prenom if user else None
        ))
    
    return response


@router.post("", response_model=CommandeResponse)
async def create_commande(
    data: CommandeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Créer une nouvelle commande/demande de transfert.
    """
    if data.quantite < 1 or data.quantite > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La quantité doit être entre 1 et 100"
        )
    
    commande = CommandeBo(
        bo_demandeur=data.bo_demandeur,
        quantite=data.quantite,
        operateur_souhaite=data.operateur_souhaite,
        user_id=current_user.id_utilisateur,
        statut_commande="en_attente"
    )
    
    db.add(commande)
    await db.commit()
    await db.refresh(commande)
    
    return CommandeResponse(
        id_commande=commande.id_commande,
        bo_demandeur=commande.bo_demandeur,
        quantite=commande.quantite,
        operateur_souhaite=commande.operateur_souhaite,
        statut_commande=commande.statut_commande,
        user_id=commande.user_id,
        date_commande=commande.date_commande,
        date_validation=commande.date_validation,
        date_livraison=commande.date_livraison,
        demandeur_nom=current_user.nom,
        demandeur_prenom=current_user.prenom
    )


@router.get("/cartons/disponibles")
async def get_cartons_disponibles(
    operateur: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Liste des cartons disponibles pour transfert (avec concentrateurs en stock au Magasin).
    """
    if current_user.role not in ['admin', 'magasin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé au personnel magasin"
        )
    
    # Récupérer les cartons avec des concentrateurs en stock au Magasin
    query = select(Carton).where(Carton.statut == "recu")
    
    if operateur:
        query = query.where(Carton.operateur == operateur)
    
    result = await db.execute(query)
    cartons = result.scalars().all()
    
    cartons_disponibles = []
    for carton in cartons:
        # Compter les concentrateurs disponibles
        result = await db.execute(
            select(Concentrateur).where(
                Concentrateur.numero_carton == carton.numero_carton,
                Concentrateur.etat == "en_stock",
                Concentrateur.affectation == "Magasin"
            )
        )
        concentrateurs = result.scalars().all()
        
        if concentrateurs:
            cartons_disponibles.append({
                "numero_carton": carton.numero_carton,
                "operateur": carton.operateur,
                "date_reception": carton.date_reception,
                "concentrateurs_disponibles": len(concentrateurs)
            })
    
    return cartons_disponibles


@router.get("/{id_commande}", response_model=CommandeResponse)
async def get_commande(
    id_commande: int,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Détail d'une commande.
    """
    result = await db.execute(
        select(CommandeBo).where(CommandeBo.id_commande == id_commande)
    )
    commande = result.scalar_one_or_none()
    
    if not commande:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commande non trouvée"
        )
    
    # Vérifier accès
    if current_user.role not in ['admin', 'magasin']:
        if commande.bo_demandeur != current_user.base_affectee:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès non autorisé à cette commande"
            )
    
    user_result = await db.execute(
        select(Utilisateur).where(Utilisateur.id_utilisateur == commande.user_id)
    )
    user = user_result.scalar_one_or_none()
    
    return CommandeResponse(
        id_commande=commande.id_commande,
        bo_demandeur=commande.bo_demandeur,
        quantite=commande.quantite,
        operateur_souhaite=commande.operateur_souhaite,
        statut_commande=commande.statut_commande,
        user_id=commande.user_id,
        date_commande=commande.date_commande,
        date_validation=commande.date_validation,
        date_livraison=commande.date_livraison,
        demandeur_nom=user.nom if user else None,
        demandeur_prenom=user.prenom if user else None
    )


@router.post("/{id_commande}/valider")
async def valider_transfert(
    id_commande: int,
    data: ValidationTransfertRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Valider un transfert en associant un carton.
    - Réservé aux rôles admin et magasin
    - Transfère les concentrateurs du carton vers la BO demandeur
    - Associe les concentrateurs à la commande
    """
    # Vérifier le rôle
    if current_user.role not in ['admin', 'magasin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs et le personnel magasin peuvent valider les transferts"
        )
    
    # Récupérer la commande
    result = await db.execute(
        select(CommandeBo).where(CommandeBo.id_commande == id_commande)
    )
    commande = result.scalar_one_or_none()
    
    if not commande:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commande non trouvée"
        )
    
    if commande.statut_commande != "en_attente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cette commande ne peut pas être validée (statut: {commande.statut_commande})"
        )
    
    # Vérifier le carton
    result = await db.execute(
        select(Carton).where(Carton.numero_carton == data.numero_carton)
    )
    carton = result.scalar_one_or_none()
    
    if not carton:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Carton {data.numero_carton} non trouvé"
        )
    
    # Récupérer les concentrateurs du carton en stock au Magasin
    result = await db.execute(
        select(Concentrateur).where(
            Concentrateur.numero_carton == data.numero_carton,
            Concentrateur.etat == "en_stock",
            Concentrateur.affectation == "Magasin"
        )
    )
    concentrateurs = result.scalars().all()
    
    if not concentrateurs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Aucun concentrateur disponible dans le carton {data.numero_carton}"
        )
    
    # Transférer les concentrateurs vers la BO
    transferred = []
    for conc in concentrateurs:
        ancien_affectation = conc.affectation
        
        # Mettre à jour le concentrateur
        conc.affectation = commande.bo_demandeur
        conc.commande_id = commande.id_commande
        conc.date_affectation = datetime.utcnow()
        conc.updated_at = datetime.utcnow()
        
        # Créer l'historique
        action = HistoriqueAction(
            concentrateur_id=conc.numero_serie,
            type_action="transfert",
            ancien_etat=conc.etat,
            nouvel_etat=conc.etat,
            ancienne_affectation=ancien_affectation,
            nouvelle_affectation=commande.bo_demandeur,
            user_id=current_user.id_utilisateur,
            commentaire=f"Transfert vers {commande.bo_demandeur} - Commande #{id_commande}"
        )
        db.add(action)
        transferred.append(conc.numero_serie)
    
    # Mettre à jour la commande
    commande.statut_commande = "validee"
    commande.date_validation = datetime.utcnow()
    
    await db.commit()
    
    return {
        "message": "Transfert validé avec succès",
        "commande_id": id_commande,
        "carton": data.numero_carton,
        "bo_destination": commande.bo_demandeur,
        "concentrateurs_transferes": len(transferred),
        "numeros_serie": transferred
    }


@router.post("/{id_commande}/annuler")
async def annuler_commande(
    id_commande: int,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Annuler une commande.
    """
    result = await db.execute(
        select(CommandeBo).where(CommandeBo.id_commande == id_commande)
    )
    commande = result.scalar_one_or_none()
    
    if not commande:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commande non trouvée"
        )
    
    # Vérifier accès
    if current_user.role not in ['admin', 'magasin']:
        if commande.user_id != current_user.id_utilisateur:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez annuler que vos propres commandes"
            )
    
    if commande.statut_commande != "en_attente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cette commande ne peut pas être annulée (statut: {commande.statut_commande})"
        )
    
    commande.statut_commande = "annulee"
    await db.commit()
    
    return {"message": "Commande annulée", "id_commande": id_commande}
