// Script de diagnóstico para verificar el código desplegado en Render
const fs = require('fs');
const path = require('path');

console.log('=== DIAGNÓSTICO DE CÓDIGO DESPLEGADO ===\n');

// 1. Verificar path actual
console.log('1. Working directory:', process.cwd());

// 2. Verificar si existe el archivo compilado
const servicePath = path.join(__dirname, 'dist', 'warehouses', 'warehouses.service.js');
console.log('2. Service path:', servicePath);
console.log('   Exists:', fs.existsSync(servicePath));

// 3. Leer primeras líneas del archivo para ver si tiene IsNull
if (fs.existsSync(servicePath)) {
  const content = fs.readFileSync(servicePath, 'utf8');

  // Buscar IsNull en el código
  const hasIsNull = content.includes('IsNull');
  console.log('3. Has IsNull():', hasIsNull);

  // Buscar getOne (no debería estar)
  const hasGetOne = content.includes('.getOne()');
  console.log('   Has .getOne():', hasGetOne);

  // Mostrar fragmento relevante
  const updateStockMatch = content.match(/updateStock[\s\S]{0,500}variant_id[\s\S]{0,200}/);
  if (updateStockMatch) {
    console.log('\n4. Fragmento de updateStock:\n');
    console.log(updateStockMatch[0].substring(0, 400));
  }
} else {
  console.log('ERROR: Archivo no encontrado!');
}

console.log('\n=== FIN DIAGNÓSTICO ===');
