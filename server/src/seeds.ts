import { LocalJsonDb } from './infrastructure/db/localJsonDb.js';

export async function seedInitialData(): Promise<void> {
  const db = LocalJsonDb.getInstance();

  console.log('[Seed] Configurando carta oficial de "Cevichería Restaurant La Barra - Sabrosísimo"...');

  // 1. Sedes (Branches)
  const branches = [
    {
      id: 'branch_principal',
      name: 'La Barra - Sede Principal',
      code: 'PRINCIPAL',
      address: 'Local Central - Salón & Barra Marina',
      phone: '(01) 456-7890',
      tableCount: 16,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'branch_sur',
      name: 'La Barra - Sede Sur',
      code: 'SEDE_SUR',
      address: 'Av. Principal Marina 340',
      phone: '(01) 987-6543',
      tableCount: 12,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  for (const b of branches) {
    await db.setDocument('branches', b);
  }

  // 2. Usuarios
  const users = [
    {
      id: 'user_admin_general',
      username: 'admin',
      name: 'Carlos Mendoza (Administrador General)',
      role: 'admin_general',
      branchIds: ['all'],
      branchId: 'all',
      pin: '1234',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user_admin_multisede',
      username: 'admin.multisede',
      name: 'Mario Rivas (Admin Multisede Principal y Sur)',
      role: 'admin_local',
      branchIds: ['branch_principal', 'branch_sur'],
      branchId: 'branch_principal',
      pin: '1002',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user_admin_principal',
      username: 'admin.principal',
      name: 'Jorge Salazar (Admin Sede Principal)',
      role: 'admin_local',
      branchIds: ['branch_principal'],
      branchId: 'branch_principal',
      pin: '1001',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user_admin_sur',
      username: 'admin.sur',
      name: 'Carla Montes (Admin Sede Sur)',
      role: 'admin_local',
      branchIds: ['branch_sur'],
      branchId: 'branch_sur',
      pin: '2002',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user_mozo_rotativo',
      username: 'mozo.rotativo',
      name: 'Gabriel (Mesero Rotativo Principal + Sur)',
      role: 'mozo',
      branchIds: ['branch_principal', 'branch_sur'],
      branchId: 'branch_principal',
      pin: '1122',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user_mozo_principal',
      username: 'mozo.principal',
      name: 'Renzo (Mesero Sede Principal)',
      role: 'mozo',
      branchIds: ['branch_principal'],
      branchId: 'branch_principal',
      pin: '1111',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user_mozo_sur',
      username: 'mozo.sur',
      name: 'Fiorella (Mesera Sede Sur)',
      role: 'mozo',
      branchIds: ['branch_sur'],
      branchId: 'branch_sur',
      pin: '2222',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user_cocina_principal',
      username: 'cocina.principal',
      name: 'Chef Barra Sede Principal',
      role: 'cocina',
      branchIds: ['branch_principal'],
      branchId: 'branch_principal',
      pin: '3333',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user_cocina_sur',
      username: 'cocina.sur',
      name: 'Cocina Sede Sur',
      role: 'cocina',
      branchIds: ['branch_sur'],
      branchId: 'branch_sur',
      pin: '3334',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user_caja_principal',
      username: 'caja.principal',
      name: 'Lucía (Caja Sede Principal)',
      role: 'cajero',
      branchIds: ['branch_principal'],
      branchId: 'branch_principal',
      pin: '5555',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user_caja_sur',
      username: 'caja.sur',
      name: 'Manuel (Caja Sede Sur)',
      role: 'cajero',
      branchIds: ['branch_sur'],
      branchId: 'branch_sur',
      pin: '5556',
      active: true,
      createdAt: new Date().toISOString()
    }
  ];

  for (const u of users) {
    await db.setDocument('users', u);
  }

  // 3. Categorías reales de la carta física de "La Barra"
  const categories = [
    { id: 'cat_ceviches', name: 'Ceviches', slug: 'ceviches', icon: '🐟', displayOrder: 1, active: true },
    { id: 'cat_leches', name: 'Leches de Tigre & Pantera', slug: 'leches', icon: '🥤', displayOrder: 2, active: true },
    { id: 'cat_duos', name: 'Dúos Marinos', slug: 'duos', icon: '🍽️', displayOrder: 3, active: true },
    { id: 'cat_trios', name: 'Tríos Marinos', slug: 'trios', icon: '🍲', displayOrder: 4, active: true },
    { id: 'cat_combinados', name: 'Combinados Especiales', slug: 'combinados', icon: '🥘', displayOrder: 5, active: true },
    { id: 'cat_arroces', name: 'Arroces & Chaufas', slug: 'arroces', icon: '🍚', displayOrder: 6, active: true },
    { id: 'cat_jaleas', name: 'Jaleas & Frituras', slug: 'jaleas', icon: '🦐', displayOrder: 7, active: true },
    { id: 'cat_calientes', name: 'Calientes & Sudados', slug: 'calientes', icon: '🍲', displayOrder: 8, active: true },
    { id: 'cat_bebidas', name: 'Bebidas & Cervezas', slug: 'bebidas', icon: '🍺', displayOrder: 9, active: true }
  ];

  for (const c of categories) {
    await db.setDocument('categories', c);
  }

  // 4. Platos reales extraídos directamente de la foto de la carta
  const products = [
    // --- CEVICHES ---
    {
      id: 'prod_cev_pescado',
      categoryId: 'cat_ceviches',
      name: 'Ceviche de Pescado',
      description: 'Pesca fresca en dados, leche de tigre natural, cebolla roja, camote y canchita.',
      basePrice: 20.0,
      spiceAllowed: true,
      sidesAllowed: ['Camote', 'Choclo', 'Canchita'],
      active: true
    },
    {
      id: 'prod_cev_mixto',
      categoryId: 'cat_ceviches',
      name: 'Ceviche Mixto',
      description: 'Pescado y mixtura de mariscos frescos en jugo de limón y ají limo.',
      basePrice: 20.0,
      spiceAllowed: true,
      sidesAllowed: ['Camote', 'Choclo', 'Canchita'],
      active: true
    },
    {
      id: 'prod_cev_pota',
      categoryId: 'cat_ceviches',
      name: 'Ceviche de Pota',
      description: 'Tiras de pota suave y fresca en potente leche de tigre.',
      basePrice: 20.0,
      spiceAllowed: true,
      sidesAllowed: ['Camote', 'Choclo', 'Canchita'],
      active: true
    },
    {
      id: 'prod_cev_pulpo',
      categoryId: 'cat_ceviches',
      name: 'Ceviche de Pulpo',
      description: 'Pulpo tierno en cortes precisos al estilo cevichero tradicional.',
      basePrice: 20.0,
      spiceAllowed: true,
      sidesAllowed: ['Camote', 'Choclo', 'Canchita'],
      active: true
    },
    {
      id: 'prod_cev_mixtura',
      categoryId: 'cat_ceviches',
      name: 'Ceviche Mixtura',
      description: 'Selección marina de conchas, calamar, langostinos y pesca.',
      basePrice: 20.0,
      spiceAllowed: true,
      sidesAllowed: ['Camote', 'Choclo', 'Canchita'],
      active: true
    },
    {
      id: 'prod_cev_conchas_negras',
      categoryId: 'cat_ceviches',
      name: 'Ceviche de Conchas Negras',
      description: 'Conchas negras frescas del norte con su jugo oscuro, limón y ají limo.',
      basePrice: 25.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita', 'Choclo', 'Camote'],
      active: true
    },
    {
      id: 'prod_cev_conchas_negras_mixtas',
      categoryId: 'cat_ceviches',
      name: 'Ceviche Conchas Negras Mixtas',
      description: 'Conchas negras combinadas con pescado o mariscos.',
      basePrice: 30.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita', 'Choclo', 'Camote'],
      active: true
    },
    {
      id: 'prod_cev_almejas',
      categoryId: 'cat_ceviches',
      name: 'Ceviche de Almejas',
      description: 'Almejas frescas seleccionadas en leche de tigre viva.',
      basePrice: 20.0,
      spiceAllowed: true,
      sidesAllowed: ['Camote', 'Canchita'],
      active: true
    },
    {
      id: 'prod_cev_langostino',
      categoryId: 'cat_ceviches',
      name: 'Ceviche de Langostino',
      description: 'Colas de langostinos tiernos marinados al momento.',
      basePrice: 20.0,
      spiceAllowed: true,
      sidesAllowed: ['Camote', 'Choclo', 'Canchita'],
      active: true
    },
    {
      id: 'prod_cev_conchas_abanico',
      categoryId: 'cat_ceviches',
      name: 'Ceviche de Conchas de Abanico',
      description: 'Conchas de abanico frescas con coral en leche de tigre.',
      basePrice: 25.0,
      spiceAllowed: true,
      sidesAllowed: ['Camote', 'Choclo', 'Canchita'],
      active: true
    },
    {
      id: 'prod_cev_huancaina',
      categoryId: 'cat_ceviches',
      name: 'Ceviche + Papa a la Huancaína',
      description: 'El clásico matrimonio peruano: ceviche fresco con papa a la huancaína cremosa.',
      basePrice: 20.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita', 'Choclo'],
      active: true
    },

    // --- LECHES DE TIGRE & PANTERA ---
    {
      id: 'prod_leche_pescado',
      categoryId: 'cat_leches',
      name: 'Leche de Pescado',
      description: 'Copa concentrada de leche de tigre con tropezones de pescado fresco.',
      basePrice: 15.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita', 'Choclo'],
      active: true
    },
    {
      id: 'prod_leche_mixta',
      categoryId: 'cat_leches',
      name: 'Leche Mixta',
      description: 'Leche de tigre con mixtura de mariscos y chicharrón.',
      basePrice: 15.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita', 'Choclo'],
      active: true
    },
    {
      id: 'prod_leche_pota',
      categoryId: 'cat_leches',
      name: 'Leche de Pota',
      description: 'Leche de tigre concentrada con pota fresca.',
      basePrice: 15.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita', 'Choclo'],
      active: true
    },
    {
      id: 'prod_leche_pantera',
      categoryId: 'cat_leches',
      name: 'Leche de Pantera',
      description: 'Potente leche oscura a base de jugo de conchas negras norteñas.',
      basePrice: 15.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita', 'Choclo'],
      active: true
    },
    {
      id: 'prod_leche_pantera_mixta',
      categoryId: 'cat_leches',
      name: 'Leche de Pantera Mixta',
      description: 'Conchas negras, mariscos y trozos de pescado en copa afrodisíaca.',
      basePrice: 20.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita', 'Choclo'],
      active: true
    },

    // --- DÚOS MARINOS ---
    {
      id: 'prod_duo_mariscos_cev',
      categoryId: 'cat_duos',
      name: 'Dúo: Arroz con Mariscos + Ceviche',
      description: 'Combinación perfecta de arroz con mariscos meloso y ceviche fresco.',
      basePrice: 15.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita', 'Sarza criolla'],
      active: true
    },
    {
      id: 'prod_duo_mariscos_chich',
      categoryId: 'cat_duos',
      name: 'Dúo: Arroz con Mariscos + Chicharrón',
      description: 'Arroz con mariscos acompañado de chicharrón crocante de pescado.',
      basePrice: 15.0,
      spiceAllowed: false,
      sidesAllowed: ['Sarza criolla', 'Tártara'],
      active: true
    },
    {
      id: 'prod_duo_chaufa_cev',
      categoryId: 'cat_duos',
      name: 'Dúo: Chaufa de Mariscos + Ceviche',
      description: 'Arroz chaufa al wok con mixtura marina y ceviche de pescado.',
      basePrice: 15.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita'],
      active: true
    },
    {
      id: 'prod_duo_chaufa_chich',
      categoryId: 'cat_duos',
      name: 'Dúo: Chaufa de Mariscos + Chicharrón',
      description: 'Chaufa marino salteado con chicharrón crocante.',
      basePrice: 15.0,
      spiceAllowed: false,
      sidesAllowed: ['Tártara', 'Sarza criolla'],
      active: true
    },

    // --- TRÍOS MARINOS ---
    {
      id: 'prod_trio_marino',
      categoryId: 'cat_trios',
      name: 'Trío Marino',
      description: 'Arroz con mariscos + Ceviche (o Leche de tigre) + Chicharrón crocante.',
      basePrice: 20.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita', 'Sarza criolla', 'Tártara'],
      active: true
    },
    {
      id: 'prod_trio_oriental',
      categoryId: 'cat_trios',
      name: 'Trío Oriental',
      description: 'Arroz chaufa de mariscos + Ceviche (o Leche de tigre) + Chicharrón.',
      basePrice: 20.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita', 'Tártara'],
      active: true
    },
    {
      id: 'prod_trio_criollo',
      categoryId: 'cat_trios',
      name: 'Trío Criollo',
      description: 'Arroz con pollo + Ceviche (o Leche de tigre) + Chicharrón.',
      basePrice: 20.0,
      spiceAllowed: true,
      sidesAllowed: ['Huancaína', 'Canchita'],
      active: true
    },

    // --- COMBINADOS ---
    {
      id: 'prod_comb_clasico',
      categoryId: 'cat_combinados',
      name: 'Combinado Clásico (7 Colores)',
      description: 'Tallarín rojo, chanfainita criolla, ceviche fresco, chicharrón y huancaína.',
      basePrice: 10.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita'],
      active: true
    },
    {
      id: 'prod_comb_naomi',
      categoryId: 'cat_combinados',
      name: 'Combinado Naomi',
      description: 'Tallarín, chanfainita, ceviche, chicharrón, huancaína y arroz con pollo.',
      basePrice: 15.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita'],
      active: true
    },
    {
      id: 'prod_comb_super_nelida',
      categoryId: 'cat_combinados',
      name: 'Combinado Súper Nélida (Mega Especial)',
      description: 'Tallarín, chanfainita, ceviche, chicharrón, huancaína, arroz con pollo, causa, y arroz con mariscos.',
      basePrice: 30.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita'],
      active: true
    },
    {
      id: 'prod_tallarines_rojos',
      categoryId: 'cat_combinados',
      name: 'Tallarines Rojos + Presa + Huancaína + Ceviche',
      description: 'Tallarines caseros con presa tierna, huancaína y porción de ceviche.',
      basePrice: 15.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita'],
      active: true
    },
    {
      id: 'prod_arroz_pollo',
      categoryId: 'cat_combinados',
      name: 'Arroz con Pollo + Presa + Huancaína + Ceviche',
      description: 'Arroz con pollo al culantro con papa a la huancaína y ceviche fresco.',
      basePrice: 15.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita'],
      active: true
    },
    {
      id: 'prod_causa_agradada',
      categoryId: 'cat_combinados',
      name: 'Causa Agradada Marina',
      description: 'Causa de papa amarilla rellena y coronada con ceviche o mariscos.',
      basePrice: 15.0,
      spiceAllowed: true,
      sidesAllowed: [],
      active: true
    },

    // --- ARROCES ---
    {
      id: 'prod_arroz_mariscos',
      categoryId: 'cat_arroces',
      name: 'Arroz con Mariscos',
      description: 'Porción entera de arroz criollo meloso con abundantes mariscos.',
      basePrice: 15.0,
      spiceAllowed: false,
      sidesAllowed: ['Sarza criolla'],
      active: true
    },
    {
      id: 'prod_chaufa_mariscos',
      categoryId: 'cat_arroces',
      name: 'Chaufa de Mariscos',
      description: 'Chaufa salteado al wok con mariscos, cebolla china y sillao.',
      basePrice: 15.0,
      spiceAllowed: false,
      sidesAllowed: [],
      active: true
    },

    // --- JALEAS ---
    {
      id: 'prod_jalea_pescado',
      categoryId: 'cat_jaleas',
      name: 'Jalea de Pescado',
      description: 'Trozos de pescado fritos al punto crocante con yucas y sarza criolla.',
      basePrice: 20.0,
      spiceAllowed: false,
      sidesAllowed: ['Yuca frita', 'Sarza criolla', 'Tártara'],
      active: true
    },
    {
      id: 'prod_jalea_mixta',
      categoryId: 'cat_jaleas',
      name: 'Jalea Mixta Marina',
      description: 'Pescado, calamar, pota y mariscos crocantes con yucas doradas.',
      basePrice: 20.0,
      spiceAllowed: false,
      sidesAllowed: ['Yuca dorada', 'Sarza criolla', 'Tártara'],
      active: true
    },

    // --- CALIENTES ---
    {
      id: 'prod_sudado_cabrilla',
      categoryId: 'cat_calientes',
      name: 'Sudado de Cabrilla',
      description: 'Cabrilla entera cocida a fuego lento con tomate, cebolla, chicha y yucas.',
      basePrice: 30.0,
      spiceAllowed: true,
      sidesAllowed: ['Arroz blanco', 'Yuca sancochada'],
      active: true
    },
    {
      id: 'prod_sudado_tramboyo',
      categoryId: 'cat_calientes',
      name: 'Sudado de Tramboyo',
      description: 'Tramboyo de peña sudado en caldo concentrado cevichero.',
      basePrice: 30.0,
      spiceAllowed: true,
      sidesAllowed: ['Arroz blanco', 'Yuca'],
      active: true
    },
    {
      id: 'prod_sudado_pintadilla',
      categoryId: 'cat_calientes',
      name: 'Sudado de Pintadilla',
      description: 'Pescado pintadilla con su chicha de jora, ají amarillo y culantro.',
      basePrice: 30.0,
      spiceAllowed: true,
      sidesAllowed: ['Arroz blanco', 'Yuca'],
      active: true
    },
    {
      id: 'prod_parihuela_mixta',
      categoryId: 'cat_calientes',
      name: 'Parihuela Mixta La Barra',
      description: 'Parihuela potente y reponedora con conchas, cangrejo, calamar y pescado.',
      basePrice: 30.0,
      spiceAllowed: true,
      sidesAllowed: ['Canchita'],
      active: true
    },
    {
      id: 'prod_chilcano',
      categoryId: 'cat_calientes',
      name: 'Chilcano Caliente',
      description: 'Caldo de pescado concentrado con limón, cebollita y canchita.',
      basePrice: 8.0,
      spiceAllowed: false,
      sidesAllowed: ['Canchita', 'Limón'],
      active: true
    },
    {
      id: 'prod_chilcano_especial',
      categoryId: 'cat_calientes',
      name: 'Chilcano Especial con Mariscos',
      description: 'Caldo chilcano con trozos de pescado y mixtura de mariscos.',
      basePrice: 10.0,
      spiceAllowed: false,
      sidesAllowed: ['Canchita', 'Limón'],
      active: true
    },

    // --- BEBIDAS ---
    {
      id: 'prod_refresco_vaso',
      categoryId: 'cat_bebidas',
      name: 'Refresco Natural (Vaso)',
      description: 'Chicha morada casera o refresco de maracuyá helado.',
      basePrice: 2.0,
      spiceAllowed: false,
      sidesAllowed: [],
      active: true
    },
    {
      id: 'prod_refresco_medio_litro',
      categoryId: 'cat_bebidas',
      name: 'Refresco Natural (Medio Litro)',
      description: 'Medio litro de chicha morada o maracuyá natural.',
      basePrice: 4.0,
      spiceAllowed: false,
      sidesAllowed: [],
      active: true
    },
    {
      id: 'prod_refresco_litro',
      categoryId: 'cat_bebidas',
      name: 'Refresco Natural (Jarra 1 Litro)',
      description: '1 Litro de refresco natural de fruta fresca helado.',
      basePrice: 8.0,
      spiceAllowed: false,
      sidesAllowed: [],
      active: true
    },
    {
      id: 'prod_gaseosa_mediana',
      categoryId: 'cat_bebidas',
      name: 'Gaseosa Mediana',
      description: 'Inca Kola o Coca Cola personal.',
      basePrice: 3.0,
      spiceAllowed: false,
      sidesAllowed: [],
      active: true
    },
    {
      id: 'prod_gaseosa_gordita',
      categoryId: 'cat_bebidas',
      name: 'Gaseosa Gordita',
      description: 'Inca Kola o Coca Cola presentación Gordita bien helada.',
      basePrice: 5.0,
      sidesAllowed: [],
      spiceAllowed: false,
      active: true
    },
    {
      id: 'prod_gaseosa_1l',
      categoryId: 'cat_bebidas',
      name: 'Gaseosa 1 Litro',
      description: 'Inca Kola o Coca Cola retornable 1L.',
      basePrice: 8.0,
      spiceAllowed: false,
      sidesAllowed: [],
      active: true
    },
    {
      id: 'prod_cerveza_pilsen',
      categoryId: 'cat_bebidas',
      name: 'Cerveza Pilsen Callao',
      description: 'Cerveza rubia heladísima para acompañar el ceviche.',
      basePrice: 10.0,
      spiceAllowed: false,
      sidesAllowed: [],
      active: true
    },
    {
      id: 'prod_cerveza_cusquena',
      categoryId: 'cat_bebidas',
      name: 'Cerveza Cusqueña (Trigo o Negra)',
      description: 'Cusqueña Trigo o Negra helada.',
      basePrice: 12.0,
      spiceAllowed: false,
      sidesAllowed: [],
      active: true
    }
  ];

  for (const p of products) {
    await db.setDocument('products', p);
  }

  // 5. Configuración de Disponibilidad Multilocal
  // Por ejemplo, en Sede Sur conchas negras está agotado por marea alta para demostrar el multilocal
  for (const b of branches) {
    for (const p of products) {
      const isUnavailable = b.id === 'branch_sur' && (p.id === 'prod_cev_conchas_negras' || p.id === 'prod_sudado_tramboyo');
      await db.setDocument('branch_configs', {
        id: `${b.id}_${p.id}`,
        branchId: b.id,
        productId: p.id,
        isAvailable: !isUnavailable,
        outOfStockReason: isUnavailable ? 'Pesca fresca agotada hoy en Sede Sur' : undefined,
        updatedAt: new Date().toISOString()
      });
    }
  }

  // 6. Pedidos iniciales de muestra
  const sampleOrders = [
    {
      id: 'ord_101',
      branchId: 'branch_principal',
      tableNumber: 2,
      waiterId: 'user_mozo_1',
      waiterName: 'Carlos (Mozo)',
      items: [
        {
          id: 'item_1',
          productId: 'prod_trio_marino',
          productName: 'Trío Marino',
          quantity: 1,
          unitPrice: 20.0,
          subtotal: 20.0,
          spiceLevel: 'BRAVO',
          selectedSides: ['Canchita', 'Sarza criolla'],
          notes: 'Con extra canchita',
          status: 'PREPARING'
        },
        {
          id: 'item_2',
          productId: 'prod_refresco_litro',
          productName: 'Refresco Natural (Jarra 1 Litro)',
          quantity: 1,
          unitPrice: 8.0,
          subtotal: 8.0,
          status: 'READY'
        }
      ],
      totalAmount: 28.0,
      status: 'PREPARING',
      notes: 'Mesa familiar',
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'ord_102',
      branchId: 'branch_principal',
      tableNumber: 5,
      waiterId: 'user_mozo_1',
      waiterName: 'Carlos (Mozo)',
      items: [
        {
          id: 'item_3',
          productId: 'prod_comb_super_nelida',
          productName: 'Combinado Súper Nélida (Mega Especial)',
          quantity: 1,
          unitPrice: 30.0,
          subtotal: 30.0,
          spiceLevel: 'MEDIO',
          selectedSides: ['Canchita'],
          notes: 'Bien servido',
          status: 'PENDING'
        },
        {
          id: 'item_4',
          productId: 'prod_cerveza_pilsen',
          productName: 'Cerveza Pilsen Callao',
          quantity: 2,
          unitPrice: 10.0,
          subtotal: 20.0,
          status: 'READY'
        }
      ],
      totalAmount: 50.0,
      status: 'PENDING',
      createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  for (const o of sampleOrders) {
    await db.setDocument('orders', o);
  }

  console.log('[Seed] Carta de "La Barra" cargada exitosamente.');
}
