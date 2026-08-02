import { Product } from "./types";

export function generateAffiliateCode(seed?: string): string {
  if (!seed) {
    seed = "NEXUS_DEFAULT_SEED_PROD";
  }

  // Pure deterministic hashing algorithm based on seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  const absHash = Math.abs(hash);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  
  let code = "";
  let current = absHash;
  for (let i = 0; i < 6; i++) {
    const idx = (current + i * 17 + (seed.charCodeAt(i % seed.length) || 0) * 13) % chars.length;
    code += chars.charAt(idx);
    current = Math.floor(current / 5) + idx * 7 + i;
  }
  
  // Format 2-letter uppercase prefix from seed (e.g. "OR", "EL", "NX")
  const cleanSeed = seed.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const prefix = (cleanSeed.slice(0, 2) + "NX").slice(0, 2);
  
  return `${prefix}${code.slice(0, 6)}`;
}

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "orris-chair",
    name: "Fauteuil Orris",
    tagline: "Un classique rétro-moderne au confort enveloppant.",
    description: "Le fauteuil Orris incarne l'alliance parfaite du design scandinave et du confort contemporain. Son revêtement en velours de coton premium et son capitonnage en font la pièce maîtresse idéale pour votre salon ou votre bureau de direction.",
    price: 320,
    image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=650&q=80",
    category: "Lounge",
    colors: [
      { name: "Vert Forêt", hex: "#2d4a22" },
      { name: "Sauge Doux", hex: "#84a98c" },
      { name: "Gris Brume", hex: "#cbd5e1" }
    ],
    variantsLabel: "Revêtement",
    variants: ["Velours Côtelé Premium", "Laine Bouclée Soft", "Cuir Pleine Fleur (+80€)"],
    features: [
      "Mousse haute résilience densité supérieure",
      "Pieds en chêne massif huilé à la main",
      "Structure renforcée garantie 5 ans",
      "Traitement anti-taches protecteur breveté"
    ],
    stock: 8,
    affiliateCode: "NX892A7K"
  },
  {
    id: "elvo-chair",
    name: "Fauteuil Pivotant Elvo",
    tagline: "L'élégance ergonomique aux teintes chaleureuses.",
    description: "Dessiné pour stimuler la créativité. Son assise pivotante à 360 degrés épouse délicatement la cambrure du dos pour éliminer les tensions musculaires durant les longues heures d'inspiration.",
    price: 500,
    image: "https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?auto=format&fit=crop&w=650&q=80",
    category: "Office",
    colors: [
      { name: "Orange Terre Cuite", hex: "#c2410c" },
      { name: "Jaune Moutarde", hex: "#d97706" },
      { name: "Beige Naturel", hex: "#f5f5f4" }
    ],
    variantsLabel: "Option Réfractaire",
    variants: ["Configuration Standard Libre", "Amortisseur Pneumatique Pro", "Roulettes Doubles Sol Multi-surfaces"],
    features: [
      "Système de bascule synchrone ajustable",
      "Incrustation de métal poli thermolaqué",
      "Coussins de soutien lombaires intégrés",
      "Tissu haute résistance aux frottements"
    ],
    stock: 5,
    affiliateCode: "EL503P82"
  },
  {
    id: "sienna-lounge",
    name: "Sienna Lounge Chair",
    tagline: "Le chef-d'œuvre sculptural d'une assise organique.",
    description: "Recherché par les amateurs de design du monde entier. La Sienna Lounge Chair se distingue par sa silhouette nervurée et ses piétements laqués dorés fins. Une œuvre d'art sensorielle sous tous les angles.",
    price: 550,
    image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=650&q=80",
    category: "Dining",
    colors: [
      { name: "Vert Signature Sienna", hex: "#1e3a1e" },
      { name: "Terracotta Chaleureux", hex: "#9a3412" },
      { name: "Blanc Crème Satiné", hex: "#fafaf9" }
    ],
    variantsLabel: "Finition des Pieds",
    variants: ["Laiton Doré Poli", "Chrome Argent Brillant", "Noir Mat Texture"],
    features: [
      "Design de coque nervuré pour une meilleure acoustique",
      "Pieds fins en acier renforcé anti-rayures",
      "Matériaux légers facilitant le déplacement",
      "Conception monobloc ultra-stable"
    ],
    stock: 12,
    affiliateCode: "SI550L91"
  },
  {
    id: "mollis-accent",
    name: "Fauteuil Mollis Minimal",
    tagline: "Une silhouette angulaire et compacte d'une intense modernité.",
    description: "Idéal pour meubler les espaces raffinés sans les encombrer. Le fauteuil Mollis se caractérise par des lignes droites équilibrées par des coussins moelleux déhoussables.",
    price: 320,
    image: "https://images.unsplash.com/photo-1506898667547-42e22a46e125?auto=format&fit=crop&w=650&q=80",
    category: "Rocking",
    colors: [
      { name: "Rouille Épicée", hex: "#b45309" },
      { name: "Bleu Minuit", hex: "#1e3a5f" },
      { name: "Gris Anthracite", hex: "#1e293b" }
    ],
    variantsLabel: "Type d'Armature",
    variants: ["Acier Brut Carbone", "Pieds Bois Hêtre Naturel"],
    features: [
      "Housses de coussins amovibles lavables en machine",
      "Rembourrage eco-certifié en plumes synthétiques",
      "Encombrement optimisé pour petits intérieurs",
      "Montage ultra-rapide en 10 minutes chrono"
    ],
    stock: 14,
    affiliateCode: "MO320M77"
  },
  {
    id: "kivi-cozy",
    name: "Petit Armchair Kivi",
    tagline: "Le confort d'un nuage de velours vert.",
    description: "Compact mais formidablement douillet, le pouf-fauteuil Kivi apporte une touche d'élégance cocooning instantanée. Un confort enveloppant de grande longévité.",
    price: 245,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=650&q=80",
    category: "Lounge",
    colors: [
      { name: "Sauge Intense", hex: "#3a5a40" },
      { name: "Crème d'Avril", hex: "#fefae0" }
    ],
    variantsLabel: "Taille",
    variants: ["Modèle Standard Lounge", "King-Size Relax (+45€)"],
    features: [
      "Garnissage microbilles de polystyrène à mémoire",
      "Base en tissu Oxford ultra-robuste",
      "Poignée de transport en simili-cuir intégrée"
    ],
    stock: 20,
    affiliateCode: "KI245C68"
  }
];

export const ECOMMERCE_FAQS = [
  {
    question: "Quels sont les délais et conditions de livraison ?",
    answer: "Toutes nos pièces de design sont emballées avec le plus grand soin dans des caisses en bois de protection. Nous livrons gratuitement en France et en Europe dès 200€ d'achat sous 3 à 5 jours ouvrés."
  },
  {
    question: "Quelle est votre politique de garantie de nos fauteuils ?",
    answer: "Sûrs de la qualité de notre ébénisterie et de nos assemblages, toutes nos assises disposent d'une garantie constructeur de 5 ans contre tout affaissement de mousse ou rupture d'armature. L'échange à neuf est pris en charge à 100%."
  },
  {
    question: "Est-il possible de voir ou d'essayer les modèles en showroom ?",
    answer: "Oui, notre atelier-showroom est situé à Paris et accueille les visiteurs sur rendez-vous. Vous pouvez réserver un créneau par e-mail afin de toucher les tissus et tester le confort de chaque création."
  },
  {
    question: "Comment fonctionne l'Espace Administrateur intégré ?",
    answer: "Directement accessible via le cadenas sécurisé en haut de l'écran (code 'admin'), il vous permet d'ajouter vos modèles, de modifier les stocks restants en temps réel, ou de supprimer des pièces du catalogue visible."
  }
];
