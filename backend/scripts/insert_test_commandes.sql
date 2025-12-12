-- Script d'insertion de données de test pour les commandes de transfert
-- À exécuter dans votre base de données PostgreSQL

-- Assurez-vous d'avoir au moins un utilisateur existant (user_id = 1 par exemple)
-- Si vous n'avez pas d'utilisateur, créez-en un d'abord

-- Insertion de commandes de test avec différents statuts
INSERT INTO commande_bo (user_id, bo_demandeur, quantite, operateur_souhaite, date_commande, statut_commande, created_at, updated_at)
VALUES 
    -- Commandes en attente (celles qu'on peut valider)
    (1, 'BO Nord', 10, 'Enedis', NOW() - INTERVAL '2 days', 'en_attente', NOW(), NOW()),
    (1, 'BO Sud', 5, 'EDF', NOW() - INTERVAL '1 day', 'en_attente', NOW(), NOW()),
    (1, 'BO Centre', 15, NULL, NOW() - INTERVAL '3 hours', 'en_attente', NOW(), NOW()),
    (1, 'BO Est', 8, 'Enedis', NOW() - INTERVAL '5 hours', 'en_attente', NOW(), NOW()),
    
    -- Commandes déjà validées (pour historique)
    (1, 'BO Nord', 12, 'EDF', NOW() - INTERVAL '5 days', 'validee', NOW(), NOW()),
    (1, 'BO Ouest', 7, 'Enedis', NOW() - INTERVAL '7 days', 'validee', NOW(), NOW()),
    
    -- Commande annulée
    (1, 'BO Sud', 3, NULL, NOW() - INTERVAL '4 days', 'annulee', NOW(), NOW());

-- Vérification des insertions
SELECT id_commande, bo_demandeur, quantite, operateur_souhaite, statut_commande, date_commande 
FROM commande_bo 
ORDER BY date_commande DESC;
