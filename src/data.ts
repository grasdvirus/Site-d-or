import { Product } from "./types";
import backupProducts from "./data/sauvegarde_produits.json";

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

const DEFAULT_CATALOG: Product[] = [
  {
    id: "pohb-sacs-rangement",
    name: "POHB 3 sacs de rangement de grande capacité, appuyez sur l'échappement pour ranger les couettes et les vêtements",
    tagline: "Ranger les couettes et les vêtements",
    description: "Lot de Sacs de Compression Sous Vide sans Pompe - Votre Solution de Rangement Idéale\n\nDites adieu au désordre dans le placard ! Ce lot de sacs de compression est conçu pour les familles en Côte d'Ivoire, parfait pour ranger des couvertures, des duvets et des vêtements.\n\n💨 Compression Facile sans Pompe\nPas besoin de pompe à vide ! Il suffit de presser manuellement pour expulser l'air du sac, la compression est simple et rapide, même pour les enfants et les personnes âgées.\n\n📦 3 Tailles pour Tous Besoins\nLe lot comprend 3 tailles (grande, moyenne, petite) :\n• Grande taille : Pour couvertures épaisses, duvets, oreillers volumineux\n• Moyenne taille : Pour vêtements hors saison, couvertures fines\n• Petite taille : Pour sous-vêtements, accessoires, petits articles",
    price: 7800 / 655.957,
    image: "/pohb_storage_bags.jpg",
    category: "Sac compressé",
    colors: [
      { name: "Transparent", hex: "#e2e8f0" }
    ],
    variantsLabel: "Variant de taille / Garnissage",
    variants: ["1 mètre (Lot de 3 Sacs)"],
    features: [
      "Matériau : PVC/PA épais de haute qualité",
      "Taux de compression : Jusqu'à 80%",
      "Réutilisable : Oui (Étanche air & humidité)",
      "Compression manuelle facile sans pompe"
    ],
    stock: 9,
    affiliateCode: generateAffiliateCode("POHB3SACS"),
    isFeatured: true
  }
];

export const INITIAL_PRODUCTS: Product[] = (Array.isArray(backupProducts) && backupProducts.length > 0)
  ? (backupProducts as Product[])
  : DEFAULT_CATALOG;

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
