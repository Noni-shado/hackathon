-- Script complet d'insertion de données de test pour le processus de transfert
-- À exécuter dans votre base de données PostgreSQL

-- ============================================
-- 1. COMMANDES DE TRANSFERT (demandes des BO)
-- ============================================
-- Assurez-vous d'avoir au moins un utilisateur avec id_utilisateur = 1

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


-- ============================================
-- 2. CARTONS (pour pouvoir valider les transferts)
-- ============================================
INSERT INTO carton (numero_carton, operateur, date_reception, nombre_concentrateurs, statut, created_at, updated_at)
VALUES 
    ('CART-2024-001', 'Enedis', NOW() - INTERVAL '10 days', 20, 'recu', NOW(), NOW()),
    ('CART-2024-002', 'EDF', NOW() - INTERVAL '8 days', 15, 'recu', NOW(), NOW()),
    ('CART-2024-003', 'Enedis', NOW() - INTERVAL '5 days', 25, 'recu', NOW(), NOW());


-- ============================================
-- 3. CONCENTRATEURS (en stock au Magasin, prêts pour transfert)
-- ============================================
-- Concentrateurs du carton CART-2024-001 (Enedis)
INSERT INTO concentrateur (numero_serie, modele, operateur, etat, affectation, numero_carton, date_creation, created_at, updated_at)
VALUES 
    ('CONC-EN-001', 'G3-PLC', 'Enedis', 'en_stock', 'Magasin', 'CART-2024-001', NOW(), NOW(), NOW()),
    ('CONC-EN-002', 'G3-PLC', 'Enedis', 'en_stock', 'Magasin', 'CART-2024-001', NOW(), NOW(), NOW()),
    ('CONC-EN-003', 'G3-PLC', 'Enedis', 'en_stock', 'Magasin', 'CART-2024-001', NOW(), NOW(), NOW()),
    ('CONC-EN-004', 'G3-PLC', 'Enedis', 'en_stock', 'Magasin', 'CART-2024-001', NOW(), NOW(), NOW()),
    ('CONC-EN-005', 'G3-PLC', 'Enedis', 'en_stock', 'Magasin', 'CART-2024-001', NOW(), NOW(), NOW());

-- Concentrateurs du carton CART-2024-002 (EDF)
INSERT INTO concentrateur (numero_serie, modele, operateur, etat, affectation, numero_carton, date_creation, created_at, updated_at)
VALUES 
    ('CONC-EDF-001', 'CPL-Pro', 'EDF', 'en_stock', 'Magasin', 'CART-2024-002', NOW(), NOW(), NOW()),
    ('CONC-EDF-002', 'CPL-Pro', 'EDF', 'en_stock', 'Magasin', 'CART-2024-002', NOW(), NOW(), NOW()),
    ('CONC-EDF-003', 'CPL-Pro', 'EDF', 'en_stock', 'Magasin', 'CART-2024-002', NOW(), NOW(), NOW());

-- Concentrateurs du carton CART-2024-003 (Enedis)
INSERT INTO concentrateur (numero_serie, modele, operateur, etat, affectation, numero_carton, date_creation, created_at, updated_at)
VALUES 
    ('CONC-EN-006', 'G3-PLC-V2', 'Enedis', 'en_stock', 'Magasin', 'CART-2024-003', NOW(), NOW(), NOW()),
    ('CONC-EN-007', 'G3-PLC-V2', 'Enedis', 'en_stock', 'Magasin', 'CART-2024-003', NOW(), NOW(), NOW()),
    ('CONC-EN-008', 'G3-PLC-V2', 'Enedis', 'en_stock', 'Magasin', 'CART-2024-003', NOW(), NOW(), NOW()),
    ('CONC-EN-009', 'G3-PLC-V2', 'Enedis', 'en_stock', 'Magasin', 'CART-2024-003', NOW(), NOW(), NOW()),
    ('CONC-EN-010', 'G3-PLC-V2', 'Enedis', 'en_stock', 'Magasin', 'CART-2024-003', NOW(), NOW(), NOW()),
    ('CONC-EN-011', 'G3-PLC-V2', 'Enedis', 'en_stock', 'Magasin', 'CART-2024-003', NOW(), NOW(), NOW());


-- ============================================
-- VÉRIFICATIONS
-- ============================================

-- Voir les commandes créées
SELECT 'COMMANDES:' as info;
SELECT id_commande, bo_demandeur, quantite, operateur_souhaite, statut_commande, date_commande 
FROM commande_bo 
ORDER BY date_commande DESC;

-- Voir les cartons disponibles
SELECT 'CARTONS:' as info;
SELECT numero_carton, operateur, statut, nombre_concentrateurs 
FROM carton 
WHERE statut = 'recu';

-- Voir les concentrateurs en stock au Magasin
SELECT 'CONCENTRATEURS EN STOCK AU MAGASIN:' as info;
SELECT numero_serie, operateur, etat, affectation, numero_carton 
FROM concentrateur 
WHERE etat = 'en_stock' AND affectation = 'Magasin';
