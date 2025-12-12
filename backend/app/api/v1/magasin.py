from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from datetime import datetime
from pydantic import BaseModel
import uuid

from app.core.database import get_db
from app.api.deps import get_current_user, is_admin
from app.models.user import Utilisateur
from app.models.concentrateur import Concentrateur
from app.models.carton import Carton
from app.models.action import HistoriqueAction

router = APIRouter()


# ============================================
# SCHEMAS
# ============================================

class CartonCreate(BaseModel):
    numero_carton: str
    operateur: str
    nombre_concentrateurs: Optional[int] = 0


class ConcentrateurCreate(BaseModel):
    numero_serie: str
    modele: Optional[str] = None
    operateur: str
    numero_carton: str


class ReceptionRequest(BaseModel):
    numero_carton: str
    operateur: str
    concentrateurs: List[ConcentrateurCreate]


class TransfertRequest(BaseModel):
    bo_destination: str
    concentrateurs: List[str]


# ============================================
# ENDPOINT STATS MAGASIN
# ============================================

@router.get("/stats")
async def get_magasin_stats(
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Récupérer les statistiques du magasin.
    """
    # Total concentrateurs au Magasin
    result_total = await db.execute(
        select(func.count()).select_from(Concentrateur).where(Concentrateur.affectation == 'Magasin')
    )
    total = result_total.scalar() or 0
    
    # En stock
    result_en_stock = await db.execute(
        select(func.count()).select_from(Concentrateur).where(
            Concentrateur.affectation == 'Magasin',
            Concentrateur.etat == 'en_stock'
        )
    )
    en_stock = result_en_stock.scalar() or 0
    
    # En livraison (vers les BO)
    result_en_livraison = await db.execute(
        select(func.count()).select_from(Concentrateur).where(
            Concentrateur.etat == 'en_livraison'
        )
    )
    en_livraison = result_en_livraison.scalar() or 0
    
    # Nombre de cartons
    result_cartons = await db.execute(
        select(func.count()).select_from(Carton)
    )
    nb_cartons = result_cartons.scalar() or 0
    
    return {
        "total": total,
        "en_stock": en_stock,
        "en_livraison": en_livraison,
        "nb_cartons": nb_cartons
    }


# ============================================
# ENDPOINTS CARTONS
# ============================================

@router.get("/carton/{numero_carton}")
async def get_carton(
    numero_carton: str,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Récupérer les informations d'un carton par son numéro.
    """
    if current_user.role not in ['admin', 'magasin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé au personnel magasin"
        )
    
    result = await db.execute(
        select(Carton).where(Carton.numero_carton == numero_carton)
    )
    carton = result.scalar_one_or_none()
    
    if not carton:
        return {
            "found": False,
            "numero_carton": numero_carton,
            "message": "Carton non trouvé - Nouveau carton à créer"
        }
    
    # Compter les concentrateurs déjà associés
    result = await db.execute(
        select(func.count()).where(Concentrateur.numero_carton == numero_carton)
    )
    nb_concentrateurs = result.scalar() or 0
    
    return {
        "found": True,
        "numero_carton": carton.numero_carton,
        "operateur": carton.operateur,
        "date_reception": carton.date_reception,
        "nombre_concentrateurs": carton.nombre_concentrateurs,
        "concentrateurs_enregistres": nb_concentrateurs,
        "statut": carton.statut
    }


@router.post("/carton")
async def create_or_update_carton(
    data: CartonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Créer ou mettre à jour un carton.
    """
    if current_user.role not in ['admin', 'magasin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé au personnel magasin"
        )
    
    result = await db.execute(
        select(Carton).where(Carton.numero_carton == data.numero_carton)
    )
    carton = result.scalar_one_or_none()
    
    if carton:
        # Mettre à jour
        carton.operateur = data.operateur
        carton.nombre_concentrateurs = data.nombre_concentrateurs
        carton.updated_at = datetime.utcnow()
        message = "Carton mis à jour"
    else:
        # Créer
        carton = Carton(
            numero_carton=data.numero_carton,
            operateur=data.operateur,
            nombre_concentrateurs=data.nombre_concentrateurs,
            statut="en_reception",
            date_reception=datetime.utcnow()
        )
        db.add(carton)
        message = "Carton créé"
    
    await db.commit()
    
    return {
        "message": message,
        "numero_carton": carton.numero_carton,
        "operateur": carton.operateur
    }


# ============================================
# ENDPOINTS CONCENTRATEURS
# ============================================

@router.get("/concentrateur/{numero_serie}")
async def get_concentrateur(
    numero_serie: str,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Vérifier si un concentrateur existe déjà.
    """
    if current_user.role not in ['admin', 'magasin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé au personnel magasin"
        )
    
    result = await db.execute(
        select(Concentrateur).where(Concentrateur.numero_serie == numero_serie)
    )
    concentrateur = result.scalar_one_or_none()
    
    if concentrateur:
        return {
            "exists": True,
            "numero_serie": concentrateur.numero_serie,
            "operateur": concentrateur.operateur,
            "etat": concentrateur.etat,
            "affectation": concentrateur.affectation,
            "numero_carton": concentrateur.numero_carton
        }
    
    return {
        "exists": False,
        "numero_serie": numero_serie
    }


@router.get("/operateurs")
async def get_operateurs(
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Liste des opérateurs disponibles.
    """
    return [
        {"value": "Enedis", "label": "Enedis"},
        {"value": "EDF", "label": "EDF"},
        {"value": "Orange", "label": "Orange"},
        {"value": "Bouygues", "label": "Bouygues"},
        {"value": "SFR", "label": "SFR"}
    ]


@router.get("/bases-operationnelles")
async def get_bases_operationnelles(
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Liste des bases opérationnelles disponibles.
    """
    return [
        {"value": "Magasin", "label": "Magasin (Stock central)"},
        {"value": "BO Nord", "label": "BO Nord"},
        {"value": "BO Sud", "label": "BO Sud"},
        {"value": "BO Est", "label": "BO Est"},
        {"value": "BO Ouest", "label": "BO Ouest"},
        {"value": "BO Centre", "label": "BO Centre"}
    ]


# ============================================
# ENDPOINT RECEPTION COMPLETE
# ============================================

@router.post("/reception")
async def reception_carton(
    data: ReceptionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Réception complète d'un carton avec ses concentrateurs.
    - Crée ou met à jour le carton
    - Crée les concentrateurs avec état "en_stock" et affectation "Magasin"
    - Réservé aux rôles admin et magasin
    """
    import logging
    logger = logging.getLogger(__name__)
    
    if current_user.role not in ['admin', 'magasin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs et le personnel magasin peuvent effectuer des réceptions"
        )
    
    if not data.concentrateurs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun concentrateur à enregistrer"
        )
    
    try:
        # Créer ou mettre à jour le carton
        result = await db.execute(
            select(Carton).where(Carton.numero_carton == data.numero_carton)
        )
        carton = result.scalar_one_or_none()
        
        if not carton:
            carton = Carton(
                numero_carton=data.numero_carton,
                operateur=data.operateur,
                nombre_concentrateurs=len(data.concentrateurs),
                statut="recu",
                date_reception=datetime.utcnow()
            )
            db.add(carton)
        else:
            carton.nombre_concentrateurs = (carton.nombre_concentrateurs or 0) + len(data.concentrateurs)
            carton.statut = "recu"
            carton.date_reception = datetime.utcnow()
            carton.updated_at = datetime.utcnow()
        
        # Flush pour s'assurer que le carton existe avant les concentrateurs (FK)
        await db.flush()
        
        created_concentrateurs = []
        errors = []
        
        for conc_data in data.concentrateurs:
            # Vérifier si le concentrateur existe déjà
            result = await db.execute(
                select(Concentrateur).where(Concentrateur.numero_serie == conc_data.numero_serie)
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                errors.append(f"{conc_data.numero_serie}: déjà existant")
                continue
            
            concentrateur = Concentrateur(
                numero_serie=conc_data.numero_serie,
                modele=conc_data.modele,
                operateur=conc_data.operateur,
                etat='en_stock',
                affectation='Magasin',
                numero_carton=data.numero_carton,
                date_affectation=datetime.utcnow(),
                date_dernier_etat=datetime.utcnow(),
            )
            db.add(concentrateur)
            created_concentrateurs.append(conc_data.numero_serie)
        
        # Flush pour créer les concentrateurs avant les actions historiques (FK)
        await db.flush()
        
        # Créer les actions historiques après les concentrateurs
        for numero_serie in created_concentrateurs:
            action = HistoriqueAction(
                type_action='reception_magasin',
                ancien_etat='en_livraison',
                nouvel_etat='en_stock',
                ancienne_affectation=None,
                nouvelle_affectation='Magasin',
                commentaire=f"Réception carton {data.numero_carton}",
                scan_qr=True,
                user_id=current_user.id_utilisateur,
                concentrateur_id=numero_serie,
                carton_id=data.numero_carton,
            )
            db.add(action)
        
        await db.commit()
        
        return {
            "message": "Réception validée",
            "carton": data.numero_carton,
            "operateur": data.operateur,
            "created": len(created_concentrateurs),
            "concentrateurs": created_concentrateurs,
            "errors": errors if errors else None
        }
    except Exception as e:
        await db.rollback()
        logger.error(f"Erreur lors de la réception: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'insertion: {str(e)}"
        )


@router.post("/transfert")
async def transfert_bo(
    data: TransfertRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Transfert de concentrateurs du Magasin vers une BO.
    - Réservé aux rôles admin et magasin
    """
    # Vérifier le rôle
    if current_user.role not in ['admin', 'magasin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs et le personnel magasin peuvent effectuer des transferts"
        )
    
    if not data.concentrateurs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun concentrateur sélectionné"
        )
    
    transferred = []
    errors = []
    
    for numero_serie in data.concentrateurs:
        # Récupérer le concentrateur
        result = await db.execute(
            select(Concentrateur).where(Concentrateur.numero_serie == numero_serie)
        )
        concentrateur = result.scalar_one_or_none()
        
        if not concentrateur:
            errors.append(f"{numero_serie}: introuvable")
            continue
        
        if concentrateur.affectation != 'Magasin':
            errors.append(f"{numero_serie}: pas au Magasin")
            continue
        
        # Mettre à jour le concentrateur
        ancien_affectation = concentrateur.affectation
        concentrateur.affectation = data.bo_destination
        concentrateur.date_affectation = datetime.utcnow()
        
        # Créer l'action historique
        action = HistoriqueAction(
            type_action='transfert_bo',
            ancien_etat=concentrateur.etat,
            nouvel_etat=concentrateur.etat,
            ancienne_affectation=ancien_affectation,
            nouvelle_affectation=data.bo_destination,
            commentaire=f"Transfert vers {data.bo_destination}",
            scan_qr=False,
            user_id=current_user.id_utilisateur,
            concentrateur_id=numero_serie,
        )
        db.add(action)
        transferred.append(numero_serie)
    
    await db.commit()
    
    return {
        "message": "Transfert effectué",
        "transferred": len(transferred),
        "concentrateurs": transferred,
        "destination": data.bo_destination,
        "errors": errors if errors else None
    }
