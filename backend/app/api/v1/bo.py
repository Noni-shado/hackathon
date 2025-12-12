from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.models import Utilisateur, Concentrateur, HistoriqueAction, CommandeBo
from app.api.deps import get_current_user

router = APIRouter(prefix="/bo", tags=["Base Opérationnelle"])


# ============================================
# SCHEMAS
# ============================================

class ActionConcentrateurRequest(BaseModel):
    numero_serie: str


class DemandeTransfertRequest(BaseModel):
    quantite: int
    operateur_souhaite: Optional[str] = None


# ============================================
# ENDPOINT LISTE DES BO (pour admin)
# ============================================

@router.get("/liste")
async def get_liste_bo(
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Récupérer la liste des bases opérationnelles disponibles.
    Accessible uniquement aux admins.
    """
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent voir la liste des BO"
        )
    
    # Récupérer les affectations distinctes qui ressemblent à des BO
    result = await db.execute(
        select(Concentrateur.affectation)
        .where(Concentrateur.affectation.isnot(None))
        .where(Concentrateur.affectation != 'Magasin')
        .where(Concentrateur.affectation != 'Labo')
        .distinct()
    )
    bos = [row[0] for row in result.fetchall() if row[0]]
    
    # Ajouter aussi les BO des utilisateurs
    result_users = await db.execute(
        select(Utilisateur.base_affectee)
        .where(Utilisateur.base_affectee.isnot(None))
        .distinct()
    )
    bos_users = [row[0] for row in result_users.fetchall() if row[0]]
    
    # BO par défaut (toujours disponibles)
    default_bos = ['BO Nord', 'BO Sud', 'BO Centre', 'BO Est', 'BO Ouest']
    
    # Fusionner et dédupliquer
    all_bos = list(set(bos + bos_users + default_bos))
    all_bos.sort()
    
    return all_bos


# ============================================
# ENDPOINT STATS BO (pour admin - stats d'une BO specifique)
# ============================================

@router.get("/stats/{bo_name}")
async def get_bo_stats(
    bo_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Récupérer les statistiques d'une BO spécifique.
    Accessible aux admins pour n'importe quelle BO.
    """
    # Compter par état
    result_total = await db.execute(
        select(func.count()).select_from(Concentrateur).where(Concentrateur.affectation == bo_name)
    )
    total = result_total.scalar() or 0
    
    result_en_stock = await db.execute(
        select(func.count()).select_from(Concentrateur).where(
            Concentrateur.affectation == bo_name,
            Concentrateur.etat == 'en_stock'
        )
    )
    en_stock = result_en_stock.scalar() or 0
    
    result_poses = await db.execute(
        select(func.count()).select_from(Concentrateur).where(
            Concentrateur.affectation == bo_name,
            Concentrateur.etat == 'pose'
        )
    )
    poses = result_poses.scalar() or 0
    
    result_a_tester = await db.execute(
        select(func.count()).select_from(Concentrateur).where(
            Concentrateur.affectation == bo_name,
            Concentrateur.etat == 'a_tester'
        )
    )
    a_tester = result_a_tester.scalar() or 0
    
    result_en_livraison = await db.execute(
        select(func.count()).select_from(Concentrateur).where(
            Concentrateur.affectation == bo_name,
            Concentrateur.etat == 'en_livraison'
        )
    )
    en_livraison = result_en_livraison.scalar() or 0
    
    return {
        "bo_name": bo_name,
        "total": total,
        "en_stock": en_stock,
        "poses": poses,
        "a_tester": a_tester,
        "en_livraison": en_livraison
    }


# ============================================
# ENDPOINT INFO BO
# ============================================

@router.get("/info")
async def get_bo_info(
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Récupérer les informations de la BO de l'utilisateur connecté.
    """
    if not current_user.base_affectee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune base opérationnelle affectée à cet utilisateur"
        )
    
    bo_name = current_user.base_affectee
    
    # Statistiques des concentrateurs de cette BO
    result = await db.execute(
        select(
            func.count(Concentrateur.numero_serie).label('total'),
            func.sum(func.cast(Concentrateur.etat == 'en_stock', Integer)).label('en_stock'),
            func.sum(func.cast(Concentrateur.etat == 'pose', Integer)).label('poses'),
            func.sum(func.cast(Concentrateur.etat == 'a_tester', Integer)).label('a_tester'),
        ).where(Concentrateur.affectation == bo_name)
    )
    stats = result.first()
    
    # Compter par état manuellement pour éviter les problèmes de cast
    result_total = await db.execute(
        select(func.count()).where(Concentrateur.affectation == bo_name)
    )
    total = result_total.scalar() or 0
    
    result_en_stock = await db.execute(
        select(func.count()).where(
            Concentrateur.affectation == bo_name,
            Concentrateur.etat == 'en_stock'
        )
    )
    en_stock = result_en_stock.scalar() or 0
    
    result_poses = await db.execute(
        select(func.count()).where(
            Concentrateur.affectation == bo_name,
            Concentrateur.etat == 'pose'
        )
    )
    poses = result_poses.scalar() or 0
    
    result_a_tester = await db.execute(
        select(func.count()).where(
            Concentrateur.affectation == bo_name,
            Concentrateur.etat == 'a_tester'
        )
    )
    a_tester = result_a_tester.scalar() or 0
    
    # Demandes en cours
    result_demandes = await db.execute(
        select(func.count()).where(
            CommandeBo.bo_demandeur == bo_name,
            CommandeBo.statut_commande == 'en_attente'
        )
    )
    demandes_en_cours = result_demandes.scalar() or 0
    
    return {
        "nom_bo": bo_name,
        "utilisateur": f"{current_user.prenom} {current_user.nom}",
        "role": current_user.role,
        "stats": {
            "total": total,
            "en_stock": en_stock,
            "poses": poses,
            "a_tester": a_tester,
            "demandes_en_cours": demandes_en_cours
        }
    }


# ============================================
# ENDPOINT POSE (en_stock → pose)
# ============================================

@router.post("/pose")
async def poser_concentrateur(
    data: ActionConcentrateurRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Poser un concentrateur (en_stock → pose).
    Le concentrateur doit être affecté à la BO de l'utilisateur et en état 'en_stock'.
    """
    if not current_user.base_affectee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune base opérationnelle affectée"
        )
    
    # Récupérer le concentrateur
    result = await db.execute(
        select(Concentrateur).where(Concentrateur.numero_serie == data.numero_serie)
    )
    concentrateur = result.scalar_one_or_none()
    
    if not concentrateur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Concentrateur non trouvé"
        )
    
    if concentrateur.affectation != current_user.base_affectee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Ce concentrateur n'est pas affecté à votre BO ({current_user.base_affectee})"
        )
    
    if concentrateur.etat != 'en_stock':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le concentrateur doit être en état 'en_stock' pour être posé (état actuel: {concentrateur.etat})"
        )
    
    # Mettre à jour l'état
    ancien_etat = concentrateur.etat
    concentrateur.etat = 'pose'
    concentrateur.date_pose = datetime.utcnow()
    concentrateur.date_dernier_etat = datetime.utcnow()
    concentrateur.updated_at = datetime.utcnow()
    
    # Créer l'action historique
    action = HistoriqueAction(
        type_action='pose',
        ancien_etat=ancien_etat,
        nouvel_etat='pose',
        ancienne_affectation=current_user.base_affectee,
        nouvelle_affectation=current_user.base_affectee,
        commentaire=f"Pose effectuée par {current_user.prenom} {current_user.nom}",
        scan_qr=True,
        user_id=current_user.id_utilisateur,
        concentrateur_id=data.numero_serie,
    )
    db.add(action)
    
    await db.commit()
    
    return {
        "message": "Concentrateur posé avec succès",
        "numero_serie": data.numero_serie,
        "ancien_etat": ancien_etat,
        "nouvel_etat": "pose",
        "date_pose": concentrateur.date_pose
    }


# ============================================
# ENDPOINT DEPOSE (pose → a_tester)
# ============================================

@router.post("/depose")
async def deposer_concentrateur(
    data: ActionConcentrateurRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Déposer un concentrateur (pose → a_tester).
    Admin peut déposer n'importe quel concentrateur.
    Autres utilisateurs: le concentrateur doit être affecté à leur BO.
    """
    is_admin = current_user.role == 'admin'
    
    if not is_admin and not current_user.base_affectee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune base opérationnelle affectée"
        )
    
    # Récupérer le concentrateur
    result = await db.execute(
        select(Concentrateur).where(Concentrateur.numero_serie == data.numero_serie)
    )
    concentrateur = result.scalar_one_or_none()
    
    if not concentrateur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Concentrateur non trouvé"
        )
    
    # Vérifier l'affectation seulement si pas admin
    if not is_admin and concentrateur.affectation != current_user.base_affectee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Ce concentrateur n'est pas affecté à votre BO ({current_user.base_affectee})"
        )
    
    if concentrateur.etat != 'pose':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le concentrateur doit être en état 'pose' pour être déposé (état actuel: {concentrateur.etat})"
        )
    
    # Mettre à jour l'état
    ancien_etat = concentrateur.etat
    concentrateur.etat = 'a_tester'
    concentrateur.date_dernier_etat = datetime.utcnow()
    concentrateur.updated_at = datetime.utcnow()
    
    # Créer l'action historique
    bo_affectation = concentrateur.affectation or current_user.base_affectee
    action = HistoriqueAction(
        type_action='depose',
        ancien_etat=ancien_etat,
        nouvel_etat='a_tester',
        ancienne_affectation=bo_affectation,
        nouvelle_affectation=bo_affectation,
        commentaire=f"Dépose effectuée par {current_user.prenom} {current_user.nom}" + (" (admin)" if is_admin else ""),
        scan_qr=True,
        user_id=current_user.id_utilisateur,
        concentrateur_id=data.numero_serie,
    )
    db.add(action)
    
    await db.commit()
    
    return {
        "message": "Concentrateur déposé avec succès",
        "numero_serie": data.numero_serie,
        "ancien_etat": ancien_etat,
        "nouvel_etat": "a_tester"
    }


# ============================================
# ENDPOINT RECEPTION BO (livraison → en_stock)
# ============================================

@router.post("/reception")
async def reception_bo(
    data: ActionConcentrateurRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Réceptionner un concentrateur à la BO (en_livraison → en_stock).
    Met à jour l'affectation vers la BO de l'utilisateur.
    """
    if not current_user.base_affectee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune base opérationnelle affectée"
        )
    
    # Récupérer le concentrateur
    result = await db.execute(
        select(Concentrateur).where(Concentrateur.numero_serie == data.numero_serie)
    )
    concentrateur = result.scalar_one_or_none()
    
    if not concentrateur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Concentrateur non trouvé"
        )
    
    if concentrateur.etat != 'en_livraison':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le concentrateur doit être en état 'en_livraison' pour être réceptionné (état actuel: {concentrateur.etat})"
        )
    
    # Mettre à jour l'état et l'affectation
    ancien_etat = concentrateur.etat
    ancienne_affectation = concentrateur.affectation
    
    concentrateur.etat = 'en_stock'
    concentrateur.affectation = current_user.base_affectee
    concentrateur.date_affectation = datetime.utcnow()
    concentrateur.date_dernier_etat = datetime.utcnow()
    concentrateur.updated_at = datetime.utcnow()
    
    # Créer l'action historique
    action = HistoriqueAction(
        type_action='reception_bo',
        ancien_etat=ancien_etat,
        nouvel_etat='en_stock',
        ancienne_affectation=ancienne_affectation,
        nouvelle_affectation=current_user.base_affectee,
        commentaire=f"Réception à {current_user.base_affectee} par {current_user.prenom} {current_user.nom}",
        scan_qr=True,
        user_id=current_user.id_utilisateur,
        concentrateur_id=data.numero_serie,
    )
    db.add(action)
    
    await db.commit()
    
    return {
        "message": "Concentrateur réceptionné avec succès",
        "numero_serie": data.numero_serie,
        "ancien_etat": ancien_etat,
        "nouvel_etat": "en_stock",
        "ancienne_affectation": ancienne_affectation,
        "nouvelle_affectation": current_user.base_affectee
    }


# ============================================
# ENDPOINT DEMANDE DE TRANSFERT
# ============================================

@router.post("/demande-transfert")
async def creer_demande_transfert(
    data: DemandeTransfertRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Créer une demande de transfert de concentrateurs vers cette BO.
    Cette demande apparaîtra dans la liste des transferts du Magasin.
    """
    if not current_user.base_affectee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune base opérationnelle affectée"
        )
    
    if data.quantite <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La quantité doit être supérieure à 0"
        )
    
    # Créer la commande
    commande = CommandeBo(
        user_id=current_user.id_utilisateur,
        bo_demandeur=current_user.base_affectee,
        quantite=data.quantite,
        operateur_souhaite=data.operateur_souhaite,
        date_commande=datetime.utcnow(),
        statut_commande='en_attente'
    )
    db.add(commande)
    await db.commit()
    await db.refresh(commande)
    
    return {
        "message": "Demande de transfert créée avec succès",
        "id_commande": commande.id_commande,
        "bo_demandeur": current_user.base_affectee,
        "quantite": data.quantite,
        "operateur_souhaite": data.operateur_souhaite,
        "statut": "en_attente"
    }


# ============================================
# ENDPOINT LISTE DES DEMANDES
# ============================================

@router.get("/demandes")
async def get_demandes_bo(
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Récupérer les demandes de transfert de la BO de l'utilisateur.
    """
    if not current_user.base_affectee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune base opérationnelle affectée"
        )
    
    result = await db.execute(
        select(CommandeBo)
        .where(CommandeBo.bo_demandeur == current_user.base_affectee)
        .order_by(CommandeBo.date_commande.desc())
    )
    demandes = result.scalars().all()
    
    return [
        {
            "id_commande": d.id_commande,
            "quantite": d.quantite,
            "operateur_souhaite": d.operateur_souhaite,
            "date_commande": d.date_commande,
            "statut": d.statut_commande,
            "date_validation": d.date_validation,
            "date_livraison": d.date_livraison
        }
        for d in demandes
    ]


# ============================================
# ENDPOINT CONCENTRATEURS DE LA BO
# ============================================

@router.get("/concentrateurs")
async def get_concentrateurs_bo(
    etat: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Récupérer les concentrateurs de la BO de l'utilisateur.
    """
    if not current_user.base_affectee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune base opérationnelle affectée"
        )
    
    query = select(Concentrateur).where(
        Concentrateur.affectation == current_user.base_affectee
    )
    
    if etat:
        query = query.where(Concentrateur.etat == etat)
    
    query = query.order_by(Concentrateur.date_dernier_etat.desc())
    
    result = await db.execute(query)
    concentrateurs = result.scalars().all()
    
    return [
        {
            "numero_serie": c.numero_serie,
            "modele": c.modele,
            "operateur": c.operateur,
            "etat": c.etat,
            "date_affectation": c.date_affectation,
            "date_pose": c.date_pose,
            "date_dernier_etat": c.date_dernier_etat
        }
        for c in concentrateurs
    ]
