-- Script pour mettre à jour les concentrateurs sans date_dernier_etat
-- Exécuter ce script dans PostgreSQL

UPDATE concentrateur 
SET date_dernier_etat = '2025-08-15 10:00:00'
WHERE date_dernier_etat IS NULL;

-- Vérification
SELECT numero_serie, date_dernier_etat 
FROM concentrateur 
WHERE date_dernier_etat = '2025-08-15 10:00:00';
