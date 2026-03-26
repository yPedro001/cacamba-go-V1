import { generatePixPayload } from './src/core/domain/pix-utils';

const key = '11983903780';
const amount = 300.50;
const name = 'PEDRO TESTE';
const city = 'SAO PAULO';

const payload = generatePixPayload(key, amount, name, city);
console.log('Payload Gerado:', payload);

// Validação básica de estrutura
if (payload.startsWith('000201')) {
  console.log('✅ Formato Inicial OK (000201)');
} else {
  console.log('❌ Formato Inicial Inválido');
}

if (payload.includes('26390014br.gov.bcb.pix0114+5511983903780')) {
  console.log('✅ Chave Pix formatada com +55 OK');
} else {
  console.log('❌ Chave Pix ou GUI Inválidos');
}

if (payload.includes('5406300.50')) {
  console.log('✅ Valor formatado OK (5406300.50)');
} else {
  console.log('❌ Valor formatado Inválido');
}

if (payload.endsWith(payload.slice(-4))) {
    const crc = payload.slice(-4);
    console.log('CRC Calculado:', crc);
}
