/**
 * YIXIN MACHINERY — single replaceable brand / lead / ads config.
 * Swap values here. Do not hunt through HTML.
 *
 * Form endpoint examples:
 *   Formspree:  https://formspree.io/f/xxxxxxxx
 *   CF Worker:  https://leads.your-domain.workers.dev/inquiry
 *   Make/Zap:   https://hook.eu1.make.com/xxxxxxxx
 */
window.SITE_CONFIG = {
  brand: {
    shortName: "YIXIN INTELLIGENT EQUIPMENT",
    legalName: "Guangzhou Yixin Intelligent Equipment Co., Ltd.",
    legalNameZh: "广州亿鑫智能设备有限公司",
    tagline: "Factory-direct blister packing, tablet press, and tube filling equipment",
    city: "Huadu, Guangzhou, China",
    founded: "2018",
  },

  contact: {
    email: "ll-knit@ll-knit.com",
    phoneDisplay: "+86 138 0000 0000",
    whatsapp: "+86 138 0000 0000",
    /* digits only, country code included, no + or spaces */
    whatsappDigits: "8613800000000",
    address: "Huadu District, Guangzhou, Guangdong, China",
    addressZh: "广东省广州市花都区",
    hours: "Mon–Sat 08:30–18:00 CST (UTC+8)",
  },

  form: {
    /**
     * Connected to live ll-knit UniCloud -> JDY B2B inquiry pipeline.
     */
    endpoint:
      "https://fc-mp-095b1411-0b4f-4187-8af3-42d6ffd0ffe9.next.bspapp.com/jdy-plugin?route=/b2b-inquiry",
    method: "POST",
    replySla: "4 business hours",
  },

  ads: {
    /* Live Google Ads account 862-520-1298 primary lead conversion */
    conversionId: "AW-18592928778",
    conversionLabel: "ryMbCOinur4dEIqo5qFF",
  },

  whatsappPrefill:
    "Hello Yixin, I need a quotation for packaging / tablet equipment. Product: ",
};
