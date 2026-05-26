export type Language = "fr" | "en" | "ar" | "es";
export type Theme = "white" | "black";
export type Currency = "CFA" | "USD" | "EUR";

export interface TranslationDictionary {
  // App Header / Controls
  home: string;
  atelier: string;
  collection: string;
  help: string;
  myAccount: string;
  cart: string;
  login: string;
  admin: string;
  store: string;
  adminDashboard: string;
  signOut: string;
  connectedAs: string;
  myPurchases: string;
  noOrdersYet: string;
  restoreCatalog: string;
  restoreCatalogBtn: string;
  adminOnlyMsg: string;
  
  // Settings Window
  settingsTitle: string;
  langLabel: string;
  themeLabel: string;
  currencyLabel: string;
  lightTheme: string;
  darkTheme: string;
  closeBtn: string;

  // Hero
  heroTag: string;
  heroTitle: string;
  heroSub: string;
  heroDesc: string;
  heroViewCollection: string;
  heroStartAtelier: string;

  // Atelier sandbox / customized
  atelierTitle: string;
  atelierDesc: string;
  customProductTitle: string;
  woodEssence: string;
  fabricColor: string;
  cushionThickness: string;
  extraArmrests: string;
  addCustomToCartBtn: string;
  customAddedText: string;
  atelierConfig: string;
  
  // Pricing Search and Categories
  searchPlaceholder: string;
  catAll: string;
  catLounge: string;
  catOffice: string;
  catDining: string;
  catRocking: string;
  tarifBoutique: string;
  addToCart: string;
  addedTitle: string;
  outOfStock: string;
  lowStock: string;
  favoriteHint: string;
  warrantyTitle: string;
  warrantyDesc: string;
  warrantyDeliveryBtn: string;

  // Cart / Checkout Dialog
  cartTitle: string;
  cartTotal: string;
  cartSubtotal: string;
  promoCode: string;
  promoApplied: string;
  shipping: string;
  grandTotal: string;
  checkoutBtn: string;
  emptyCart: string;
  checkoutFormTitle: string;
  fullName: string;
  shippingAddress: string;
  city: string;
  zipCode: string;
  cardNumber: string;
  cvv: string;
  paySubmit: string;
  orderCompleted: string;
  trackingNumber: string;
  orderConfirmedMsg: string;
  continueShoppingBtn: string;
  shippingPlaceholder: string;
  cityPlaceholder: string;
  fullNamePlaceholder: string;
  zipPlaceholder: string;
  promoPlaceholder: string;
  promoApplyBtn: string;
  itemsLabel: string;
  deliveredTo: string;
  
  // FAQ Title
  faqTitle: string;
  faqSubtitle: string;
  faqList: { question: string; answer: string }[];
  
  // Account Details Modal
  accountDetailsTitle: string;
  userRoleAdmin: string;
  userRoleClient: string;
  lastSignIn: string;
  orderCode: string;
  anonymousUser: string;
  switchGoogleAccount: string;
  enterPasscodeLabel: string;
  passcodePlaceholder: string;
  verifyPasscodeBtn: string;
  verificationFailed: string;
  orDivider: string;
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  fr: {
    home: "Accueil",
    atelier: "L'Atelier",
    collection: "Collection",
    help: "Aide",
    myAccount: "Mon Compte",
    cart: "Panier",
    login: "Connexion",
    admin: "Admin 🔐",
    store: "Boutique",
    adminDashboard: "Tableau de Bord Administrateur",
    signOut: "Se Déconnecter",
    connectedAs: "Connecté en tant que",
    myPurchases: "Mes achats",
    noOrdersYet: "Aucune commande passée.",
    restoreCatalog: "Restaurer le catalogue",
    restoreCatalogBtn: "Restaurer le Catalogue",
    adminOnlyMsg: "Seul l'administrateur (grasdvirus@gmail.com) peut effectuer cette opération.",
    
    settingsTitle: "Paramètres de l'Atelier",
    langLabel: "Langue",
    themeLabel: "Thème de couleur",
    currencyLabel: "Devise principale",
    lightTheme: "Blanc (Clair)",
    darkTheme: "Noir (Sombre)",
    closeBtn: "Fermer",

    heroTag: "ASSISES D’EXCEPTION",
    heroTitle: "Sculptées pour",
    heroSub: "le Corps.",
    heroDesc: "Alliance ultime d’ergonomie nordique et de bois d’ébène noble. Explorez l'artisanat et configurez en 3D interactif votre pièce maîtresse unique.",
    heroViewCollection: "Découvrir la Collection",
    heroStartAtelier: "Configurer à l'Atelier",

    atelierTitle: "L'Atelier de Personnalisation 3D",
    atelierDesc: "Modifiez l’essence du bois, le revêtement en velours ou ajoutez des options de confort exclusives. Visualisez en temps réel sous tous les angles.",
    customProductTitle: "Fauteuil Custom Nexus",
    woodEssence: "Essence de Bois",
    fabricColor: "Revêtement",
    cushionThickness: "Épaisseur du Coussin",
    extraArmrests: "Accoudoirs Rembourrés (+40€)",
    addCustomToCartBtn: "Ajouter cette Création au Panier",
    customAddedText: "Création ajoutée !",
    atelierConfig: "Configuration de votre modèle unique",

    searchPlaceholder: "Rechercher un fauteuil, une essence...",
    catAll: "Tous",
    catLounge: "Lounge",
    catOffice: "Office",
    catDining: "Dining",
    catRocking: "Rocking",
    tarifBoutique: "Tarif boutique",
    addToCart: "Ajouter au panier",
    addedTitle: "Ajouté !",
    outOfStock: "Rupture",
    lowStock: "Peu de stock",
    favoriteHint: "Retirer des favoris",
    warrantyTitle: "Garantie Atelier de 5 Ans",
    warrantyDesc: "Toutes nos assises haut de gamme bénéficient d'une assurance contre tout affaissement et l'expédition est sécurisée.",
    warrantyDeliveryBtn: "Livraison & Aide",

    cartTitle: "Votre Panier de Commande",
    cartTotal: "Total du panier",
    cartSubtotal: "Sous-total pièces",
    promoCode: "Code Promo",
    promoApplied: "Code appliqué",
    shipping: "Frais d'expédition",
    grandTotal: "Total Général",
    checkoutBtn: "Valider ma Commande",
    emptyCart: "Votre panier de création est désespérément vide.",
    checkoutFormTitle: "Coordonnées de Livraison",
    fullName: "Nom complet",
    shippingAddress: "Adresse de livraison",
    city: "Ville de destination",
    zipCode: "Code Postal",
    cardNumber: "Numéro de Carte",
    cvv: "Cryptogramme (CVV)",
    paySubmit: "Payer et Valider la Commande",
    orderCompleted: "Commande validée avec succès !",
    trackingNumber: "Numéro de suivi de colis",
    orderConfirmedMsg: "votre commande est enregistrée dans notre atelier de fabrication. Vous recevrez des alertes d'avancement par email.",
    continueShoppingBtn: "Continuer ma visite",
    shippingPlaceholder: "Rue, Avenue, Appartement...",
    cityPlaceholder: "Paris, Madrid, Lyon...",
    fullNamePlaceholder: "Jean Dupont",
    zipPlaceholder: "75001",
    promoPlaceholder: "Saisir un code...",
    promoApplyBtn: "Appliquer",
    itemsLabel: "article(s)",
    deliveredTo: "Livré à",

    faqTitle: "Foire Aux Questions",
    faqSubtitle: "Tout savoir sur nos créations artisanales",
    faqList: [
      {
        question: "Quels sont les délais et conditions de livraison ?",
        answer: "Toutes nos pièces de design sont emballées avec le plus grand soin dans des caisses en bois de protection. Nous livrons gratuitement dès 200€ d'achat sous 3 à 5 jours ouvrés."
      },
      {
        question: "Quelle est votre politique de garantie de nos fauteuils ?",
        answer: "Sûrs de la qualité de notre ébénisterie et de nos assemblages, toutes nos assises disposent d'une garantie constructeur de 5 ans contre tout affaissement de mousse ou rupture d'armature."
      },
      {
        question: "Est-il possible de voir ou d'essayer les modèles en showroom ?",
        answer: "Oui, notre atelier-showroom est situé à Paris et accueille les visiteurs sur rendez-vous. Vous pouvez réserver un créneau par e-mail afin de toucher les tissus et tester le confort."
      },
      {
        question: "Comment fonctionne l'Espace Administrateur intégré ?",
        answer: "Accessible via le compte administrateur autorisé, il vous permet d'ajouter vos modèles, de modifier les stocks restants en temps réel, ou de restaurer le catalogue."
      }
    ],

    accountDetailsTitle: "Informations de votre Compte",
    userRoleAdmin: "Administrateur de l'Atelier",
    userRoleClient: "Membre Client",
    lastSignIn: "Dernière connexion",
    orderCode: "Commande",
    anonymousUser: "Utilisateur Éphémère",
    switchGoogleAccount: "Changer de compte Google",
    enterPasscodeLabel: "Code d'accès d'administration de démonstration",
    passcodePlaceholder: "Entrer le code 'admin'...",
    verifyPasscodeBtn: "Valider et déverrouiller",
    verificationFailed: "Code incorrect. Veuillez réessayer.",
    orDivider: "ou s'identifier avec"
  },
  en: {
    home: "Home",
    atelier: "Workshop",
    collection: "Collection",
    help: "Help",
    myAccount: "My Account",
    cart: "Cart",
    login: "Log In",
    admin: "Admin 🔐",
    store: "Store",
    adminDashboard: "Administrator Dashboard",
    signOut: "Sign Out",
    connectedAs: "Connected as",
    myPurchases: "My Purchases",
    noOrdersYet: "No orders placed yet.",
    restoreCatalog: "Restore catalog",
    restoreCatalogBtn: "Reset Catalog Data",
    adminOnlyMsg: "Only the administrator (grasdvirus@gmail.com) can perform this database operation.",
    
    settingsTitle: "Workshop Settings",
    langLabel: "Language",
    themeLabel: "Color Theme",
    currencyLabel: "Local Currency",
    lightTheme: "White (Light)",
    darkTheme: "Black (Dark)",
    closeBtn: "Close",

    heroTag: "EXCEPTIONAL SEATING",
    heroTitle: "Sculpted for the",
    heroSub: "Human Body.",
    heroDesc: "The ultimate alliance of Nordic ergonomics and noble ebony wood. Explore the craftsmanship and configure your unique piece in interactive 3D.",
    heroViewCollection: "Explore the Collection",
    heroStartAtelier: "Configure in Workshop",

    atelierTitle: "3D Customization Workshop",
    atelierDesc: "Modify the wood essence, velvet seat color, or add exclusive comfort features. Visualize your creation instantly from all angles.",
    customProductTitle: "Nexus Custom Armchair",
    woodEssence: "Wood Timber Essence",
    fabricColor: "Fabric Upholstery",
    cushionThickness: "Cushion Padding",
    extraArmrests: "Padded Armrests (+40€)",
    addCustomToCartBtn: "Add Bespoke Creation to Cart",
    customAddedText: "Bespoke Chair Added!",
    atelierConfig: "Bespoke product configurator specs",

    searchPlaceholder: "Search for armchair, wood material...",
    catAll: "All",
    catLounge: "Lounge",
    catOffice: "Office",
    catDining: "Dining",
    catRocking: "Rocking",
    tarifBoutique: "Retail Price",
    addToCart: "Add to Cart",
    addedTitle: "Added!",
    outOfStock: "Sold Out",
    lowStock: "Low Stock",
    favoriteHint: "Remove from favorites",
    warrantyTitle: "5-Year Workshop Warranty",
    warrantyDesc: "All of our high-end premium seats include structural safeguard insurance against foam collapsing and fully covered express shipping.",
    warrantyDeliveryBtn: "Shipping & Support",

    cartTitle: "Your Shopping Cart Summary",
    cartTotal: "Bespoke Cart Total",
    cartSubtotal: "Subtotal pieces",
    promoCode: "Promo Discount Code",
    promoApplied: "Promo discount applied",
    shipping: "Bespoke Shipping Cost",
    grandTotal: "Grand Total Cost",
    checkoutBtn: "Proceed to Checkout",
    emptyCart: "Your bespoke creations list is empty.",
    checkoutFormTitle: "Shipping & Delivery Information",
    fullName: "Full Name",
    shippingAddress: "Street Address",
    city: "Destination City",
    zipCode: "Postal / ZIP Code",
    cardNumber: "Credit Card Number",
    cvv: "Security Code (CVV)",
    paySubmit: "Pay & Validate Purchase",
    orderCompleted: "Order Confirmed successfully!",
    trackingNumber: "Package tracking code",
    orderConfirmedMsg: "is recorded directly in our design studio workshop. You will receive progress notifications via email.",
    continueShoppingBtn: "Continue browsing",
    shippingPlaceholder: "Street, main avenue, appt...",
    cityPlaceholder: "New York, Paris, London...",
    fullNamePlaceholder: "John Doe",
    zipPlaceholder: "10001",
    promoPlaceholder: "Enter code...",
    promoApplyBtn: "Apply",
    itemsLabel: "item(s)",
    deliveredTo: "Delivered to",

    faqTitle: "Frequently Asked Questions",
    faqSubtitle: "Everything you need to know about our atelier creations",
    faqList: [
      {
        question: "What are the shipping delivery times & conditions?",
        answer: "All our design pieces are safely crated in secure timber boxes. We ship for free worldwide above €200/$200 within 3 to 5 business days."
      },
      {
        question: "What is your warranty policy?",
        answer: "Confident in our joinery and upholstery craftsmanship, we cover all chairs with a 5-year constructor warranty on foam and timber structure stability."
      },
      {
        question: "Can we test or view the armchairs in person?",
        answer: "Yes, our private atelier showroom is located in central Paris and welcomes guests on appointment. Book your slot via email to inspect fabrics and comfort."
      },
      {
        question: "How does the built-in Admin portal operate?",
        answer: "Accessible via the authorized credentials secure login, it allows you to instantly catalog new items, adjust stock levels, or reset databases."
      }
    ],

    accountDetailsTitle: "Your Verified Account Profile",
    userRoleAdmin: "Master Workshop Admin",
    userRoleClient: "Bespoke Client Member",
    lastSignIn: "Last connected",
    orderCode: "Order Reference",
    anonymousUser: "Anonymous Client",
    switchGoogleAccount: "Switch Google Account",
    enterPasscodeLabel: "Demo administrator bypass passcode",
    passcodePlaceholder: "Enter passcode 'admin'...",
    verifyPasscodeBtn: "Unlock Dashboard",
    verificationFailed: "Incorrect passcode, please try again.",
    orDivider: "or authenticate with"
  },
  ar: {
    home: "الرئيسية",
    atelier: "المشغل",
    collection: "المجموعة",
    help: "المساعدة",
    myAccount: "حسابي",
    cart: "السلة",
    login: "الدخول",
    admin: "لوحة التحكم 🔐",
    store: "المتجر",
    adminDashboard: "لوحة تحكم المدير",
    signOut: "تسجيل الخروج",
    connectedAs: "متصل كـ",
    myPurchases: "مشترياتي القديمة",
    noOrdersYet: "لم تقم بأي طلبات بعد.",
    restoreCatalog: "إعادة تعيين الكتالوج",
    restoreCatalogBtn: "تحديث كتالوج المنتجات",
    adminOnlyMsg: "فقط المدير (grasdvirus@gmail.com) يمتلك الصلاحية لتنفيذ هذا الإجراء على قاعدة البيانات.",
    
    settingsTitle: "إعدادات المشغل",
    langLabel: "اللغة المستعملة",
    themeLabel: "مظهر الموقع",
    currencyLabel: "العملة المحلية",
    lightTheme: "أبيض (فاتح)",
    darkTheme: "أسود (داكن)",
    closeBtn: "إغلاق",

    heroTag: "مقاعد استثنائية ونادرة",
    heroTitle: "مصممة بعناية لراحة",
    heroSub: "جسد الإنسان.",
    heroDesc: "الدمج الفاخر لخصائص السكون والراحة النرويجية مع فخامة خشب الأبنوس الفاخر. استكشف الحرفية وصمم مقعدك الفريد بتقنية الأبعاد الثلاثية.",
    heroViewCollection: "تصفح التشكيلة الكاملة",
    heroStartAtelier: "التخصيص في المشغل",

    atelierTitle: "مشغل التخصيص ثلاثي الأبعاد",
    atelierDesc: "قم بتغيير جوهر الأخشاب، تنجيد المخمل أو إضافة خيارات راحة حصرية. شاهد التغيير حياً ومن جميع زوايا الرؤية.",
    customProductTitle: "كرسي نكسس المخصص",
    woodEssence: "نوع الخشب الفاخر",
    fabricColor: "لون قماش التنجيد",
    cushionThickness: "سمك حشوة الوسادة",
    extraArmrests: "مساند ذراعين مبطنة (+40€)",
    addCustomToCartBtn: "إضافة هذا التصميم الفاخر للسلة",
    customAddedText: "تمت إضافة الكرسي بنجاح !",
    atelierConfig: "مواصفات التخصيص الفريدة لكرسيك",

    searchPlaceholder: "ابحث عن كرسي، خشب، أو لون...",
    catAll: "الكل",
    catLounge: "استرخاء",
    catOffice: "مكتب",
    catDining: "طعام",
    catRocking: "هزاز",
    tarifBoutique: "سعر البيع",
    addToCart: "إضافة للسلة",
    addedTitle: "تمت الإضافة !",
    outOfStock: "انتهى من المخزن",
    lowStock: "مخزون محدود جداً",
    favoriteHint: "إزالة من المفضلة",
    warrantyTitle: "ضمان المشغل لـ 5 سنوات كاملة",
    warrantyDesc: "تتميز جميع مقاعدنا الفاخرة بضمان هيكلي ضد هبوط الإسفنج وتلف الهيكل الخشبي مع شحن سريع وآمن.",
    warrantyDeliveryBtn: "الشحن والدعم الفني",

    cartTitle: "ملخص سلتك الخاصة",
    cartTotal: "إجمالي السلة المخصصة",
    cartSubtotal: "المجموع الفرعي للمنتجات",
    promoCode: "رمز الخصم الترويجي",
    promoApplied: "تم تفعيل كود الخصم",
    shipping: "تكاليف الشحن الفاخر",
    grandTotal: "المجموع الكلي",
    checkoutBtn: "إتمام عملية الشراء",
    emptyCart: "قائمة السلة المخصصة فارغة حالياً.",
    checkoutFormTitle: "معلومات الشحن والتوصيل",
    fullName: "الاسم الكامل",
    shippingAddress: "عنوان الشارع السكني",
    city: "مدينة الوصول",
    zipCode: "الرمز البريدي",
    cardNumber: "رقم البطاقة الائتمانية",
    cvv: "رمز الأمان الخلفي (CVV)",
    paySubmit: "الاشتراك وتأكيد الطلب",
    orderCompleted: "تم تسجيل وتأكيد طلبك بنجاح !",
    trackingNumber: "رمز تتبع الشحنة البريدية",
    orderConfirmedMsg: "يتم إعدادها في الورشة الرئيسية الخاصة بمشغلنا. ستتلقى تحديثات الإنتاج عبر بريدك الإلكتروني قريباً.",
    continueShoppingBtn: "العودة للمتجر الرئيسي",
    shippingPlaceholder: "الشارع، البناية، رقم الشقة...",
    cityPlaceholder: "الرياض، دبي، القاهرة...",
    fullNamePlaceholder: "محمد أحمد",
    zipPlaceholder: "11411",
    promoPlaceholder: "أدخل الكود...",
    promoApplyBtn: "تطبيق الخصم",
    itemsLabel: "قطعة",
    deliveredTo: "شحن إلى",

    faqTitle: "الأسئلة الشائعة والمساعدة",
    faqSubtitle: "كل ما تود معرفته عن خدمات وتفاصيل مشغلنا",
    faqList: [
      {
        question: "ما هي شروط ومدد الشحن والتسليم؟",
        answer: "يتم شحن وتغليف كل مقعد بعناية قصوى داخل صناديق خشبية واقية. نشحن مجاناً للطلبات التي تفوق 200€/$200 في غضون 3 إلى 5 أيام عمل."
      },
      {
        question: "ما هي شروط سياسة الضمان المتاحة لمقاعدنا؟",
        answer: "ثقتنا كبيرة في خاماتنا الخشبية وقدرات التنجيد اليدوي، نضمن كامل مقاعدنا الفاخرة لمدة 5 سنوات ضد أي هبوط في الوسائد والتلف الهيكلي."
      },
      {
        question: "هل يمكننا رؤية واختبار الكراسي بأنفسنا؟",
        answer: "بكل تأكيد، صالتنا الخاصة في باريس ترحب بكم بموعد مسبق. يمكنك حجز موعد عبر البريد الإلكتروني لاختبار الأقمشة ومستويات الراحة المتنوعة."
      },
      {
        question: "كيف تعمل لوحة تحكم الإدارة المدمجة؟",
        answer: "يمكن الوصول إليها عبر الحساب المصرح به، وتسمح لك بتسجيل منتجات جديدة، ضبط قيم المخزون المتاحة فوراً، أو إعادة تهيئة النظام."
      }
    ],

    accountDetailsTitle: "تفاصيل ملفك الشخصي المؤكد",
    userRoleAdmin: "المدير العام للمشغل",
    userRoleClient: "عميل متميز",
    lastSignIn: "آخر اتصال نشط",
    orderCode: "رقم مرجع الطلب",
    anonymousUser: "عميل زائر",
    switchGoogleAccount: "تبديل حساب Google",
    enterPasscodeLabel: "رمز المرور اليدوي للمدير التجريبي",
    passcodePlaceholder: "رمز المرور الافتراضي 'admin'...",
    verifyPasscodeBtn: "فك حظر اللوحة",
    verificationFailed: "الرمز غير صحيح، يرجى المحاولة مجدداً.",
    orDivider: "أو الدخول الآمن بواسطة"
  },
  es: {
    home: "Inicio",
    atelier: "El Taller",
    collection: "Colección",
    help: "Ayuda",
    myAccount: "Mi Cuenta",
    cart: "Carrito",
    login: "Acceder",
    admin: "Admin 🔐",
    store: "Tienda",
    adminDashboard: "Panel de Administración",
    signOut: "Cerrar Sesión",
    connectedAs: "Conectado como",
    myPurchases: "Mis Compras",
    noOrdersYet: "Aún no has realizado pedidos.",
    restoreCatalog: "Restablecer catálogo",
    restoreCatalogBtn: "Restablecer el Catálogo",
    adminOnlyMsg: "Solo el administrador (grasdvirus@gmail.com) puede realizar operaciones en la base de datos.",
    
    settingsTitle: "Ajustes de Customización",
    langLabel: "Idioma",
    themeLabel: "Mapeo de Color",
    currencyLabel: "Divisa Principal",
    lightTheme: "Blanco (Claro)",
    darkTheme: "Negro (Oscuro)",
    closeBtn: "Cerrar",

    heroTag: "ASIENTOS EXTRAORDINARIOS",
    heroTitle: "Esculpidos para el",
    heroSub: "Cuerpo Humano.",
    heroDesc: "La fusión perfecta entre ergonomía nórdica y madera de ébano noble. Inspírate y diseña tu propio asiento interactivo en 3D.",
    heroViewCollection: "Explorar la Colección",
    heroStartAtelier: "Personalizar en el Taller",

    atelierTitle: "Taller interactivo de personalización 3D",
    atelierDesc: "Configura la madera de ébano, la tapicería de terciopelo premium o añade accesorios ergonómicos exclusivos en tiempo real.",
    customProductTitle: "Sillón Custom Nexus",
    woodEssence: "Esencia de Madera noble",
    fabricColor: "Tapizado de Terciopelo",
    cushionThickness: "Espesor del Cojín",
    extraArmrests: "Reposabrazos Tapizados (+40€)",
    addCustomToCartBtn: "Añadir Diseño a la Cesta",
    customAddedText: "¡Sillón Custom Añadido!",
    atelierConfig: "Configuración única del modelo",

    searchPlaceholder: "Búsqueda por sillones, maderas nobles...",
    catAll: "Todos",
    catLounge: "Lounge",
    catOffice: "Office",
    catDining: "Dining",
    catRocking: "Rocking",
    tarifBoutique: "Precio de Venta",
    addToCart: "Añadir al Carrito",
    addedTitle: "¡Añadido!",
    outOfStock: "Agotado",
    lowStock: "Poco stock",
    favoriteHint: "Eliminar de favoritos",
    warrantyTitle: "Garantía de Boutique de 5 Años",
    warrantyDesc: "Nuestros sillones de diseño premium están protegidos por una garantía estructural contra la pérdida de firmeza.",
    warrantyDeliveryBtn: "Envío y Soporte",

    cartTitle: "Tu Cesta de Compra",
    cartTotal: "Total de la cesta",
    cartSubtotal: "Subtotal piezas",
    promoCode: "Código de Promoción",
    promoApplied: "Descuento de código aplicado",
    shipping: "Frais de Envío Asegurado",
    grandTotal: "Total General",
    checkoutBtn: "Proceder al Pago",
    emptyCart: "La lista de diseños customizados está vacía.",
    checkoutFormTitle: "Información de Envío",
    fullName: "Nombre Completo",
    shippingAddress: "Dirección de Entrega",
    city: "Ciudad de Destino",
    zipCode: "Código Postal",
    cardNumber: "Número de Tarjeta de Crédito",
    cvv: "Código de Seguridad (CVV)",
    paySubmit: "Validar y Pagar Pedido",
    orderCompleted: "¡Pedido confirmado con éxito!",
    trackingNumber: "Código de seguimiento",
    orderConfirmedMsg: "está registrado directamente en nuestro taller de fabricación. Recibirás actualizaciones de producción por correo electrónico.",
    continueShoppingBtn: "Seguir comprando",
    shippingPlaceholder: "Calle, número, piso...",
    cityPlaceholder: "Madrid, Barcelona, Sevilla...",
    fullNamePlaceholder: "María Gómez",
    zipPlaceholder: "28001",
    promoPlaceholder: "Sostener código...",
    promoApplyBtn: "Aplicar",
    itemsLabel: "artículo(s)",
    deliveredTo: "Entregado a",

    faqTitle: "Preguntas Frecuentes",
    faqSubtitle: "Todo sobre nuestras creations artesanales premium",
    faqList: [
      {
        question: "¿Cuáles son los tiempos y condiciones de entrega?",
        answer: "Todos los sillones de diseño se embalan con total seguridad. Ofrecemos envíos gratis para compras superiores a 200€/$200 de 3 a 5 días hábiles."
      },
      {
        question: "¿Cuál es vuestra política de garantía?",
        answer: "Seguros de nuestra carpintería y tapicería, ofrecemos 5 años de garantía contra deslizamientos de espuma o roturas estructurales."
      },
      {
        question: "¿Se pueden probar los modelos en showroom?",
        answer: "Sí, nuestro showroom boutique de París acoge a clientes con cita previa. Escríbenos para seleccionar texturas y probar el confort."
      },
      {
        question: "¿Cómo funciona el área de administrador?",
        answer: "Accesible mediante login seguro, le permite catalogar productos, configurar el inventario o restaurar la base de datos."
      }
    ],

    accountDetailsTitle: "Información de Tu Perfil",
    userRoleAdmin: "Administrador del Taller",
    userRoleClient: "Cliente Distinguido",
    lastSignIn: "Último acceso activo",
    orderCode: "Referencia de Pedido",
    anonymousUser: "Usuario Invitado",
    switchGoogleAccount: "Cambiar cuenta Google",
    enterPasscodeLabel: "Código de administrador de demostración",
    passcodePlaceholder: "Ingresar código 'admin'...",
    verifyPasscodeBtn: "Desbloquear Panel",
    verificationFailed: "Código erróneo. Por favor intente de nuevo.",
    orDivider: "o autenticarse con"
  }
};

export const CURRENCIES: Record<Currency, { symbol: string; rate: number }> = {
  EUR: { symbol: "€", rate: 1.0 },
  USD: { symbol: "$", rate: 1.08 },
  CFA: { symbol: "FCFA", rate: 655.957 }
};

export function formatPrice(euroAmount: number, currency: Currency): string {
  const metadata = CURRENCIES[currency];
  const converted = euroAmount * metadata.rate;
  
  if (currency === "CFA") {
    // CFA is generally represented with no decimal points
    return `${Math.round(converted).toLocaleString("fr-FR")} ${metadata.symbol}`;
  } else if (currency === "USD") {
    return `${metadata.symbol}${converted.toFixed(2)}`;
  } else {
    // EUR
    return `${converted.toFixed(2)} ${metadata.symbol}`;
  }
}
