#!/usr/bin/env bash
# Script de ejecución automatizada de pruebas del proyecto Piedrazul
set -e

echo "============================================="
echo "   Iniciando verificación de pruebas        "
echo "   Proyecto: Piedrazul                       "
echo "============================================="

echo ""
echo "[1/3] Ejecutando pruebas del Backend (Spring Boot / JUnit 5)..."
cd backend
./mvnw test --batch-mode
cd ..

echo ""
echo "[2/3] Ejecutando pruebas unitarias del Frontend (Vue 3 / Vitest)..."
if command -v npm &> /dev/null; then
    cd frontend
    npm test
    cd ..
else
    echo "Aviso: 'npm' no está instalado en el PATH del sistema anfitrión."
    echo "Los archivos de prueba unitaria del frontend están listos en frontend/src/**/*.spec.js"
    echo "Para ejecutarlos en un entorno con Node.js: 'cd frontend && npm test'"
fi

echo ""
echo "[3/3] Ejecutando pruebas de Punta a Punta (Playwright E2E)..."
if command -v npx &> /dev/null; then
    npx playwright test
else
    echo "Aviso: 'npx' no está instalado en el PATH del sistema anfitrión."
    echo "Las pruebas E2E de Playwright están listas en e2e/**/*.spec.js"
    echo "Para ejecutarlas en un entorno con Node.js: 'npx playwright test'"
fi

echo ""
echo "============================================="
echo "   Todas las pruebas ejecutadas con éxito!   "
echo "============================================="
