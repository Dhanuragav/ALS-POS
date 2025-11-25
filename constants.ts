import { Category, MenuItem } from './types';

// Tax Split: 2.5% CGST + 2.5% SGST = 5% Total
export const CGST_PERCENTAGE = 0.025;
export const SGST_PERCENTAGE = 0.025;

export const RESTAURANT_NAME = "ANNALAKSHMI PURE VEG";
export const RESTAURANT_ADDRESS = "Arts College Road, Coimbatore";
export const RESTAURANT_PHONE = "+91 98765 43210";
export const RESTAURANT_GSTIN = "33ABCDE1234F1Z5";

export const SEED_MENU: MenuItem[] = [
  // Fixed Course Meals
  { id: '1', name: 'Mahalakshmi Preethi Bhojan', price: 575, category: Category.MEALS, shortCode: 'MAHA-BHOJ' },
  { id: '2', name: 'Laghu Bhojan', price: 425, category: Category.MEALS, shortCode: 'LAGHU-BHOJ' },

  // Soups / Rasam
  { id: '3', name: 'Soup / Rasam of the day', price: 150, category: Category.SOUPS, shortCode: 'SOUP-DAY' },

  // Starters / Appetizers
  { id: '4', name: 'Masala Pappad', price: 80, category: Category.STARTERS, shortCode: 'MAS-PAP' },
  { id: '5', name: 'Bajji (Assorted)', price: 160, category: Category.STARTERS, shortCode: 'BAJJI-AST' },
  { id: '6', name: 'Vada (Sambar/Rasam/Curd)', price: 160, category: Category.STARTERS, shortCode: 'VADA-VAR' },
  { id: '7', name: 'Mysore Bonda', price: 160, category: Category.STARTERS, shortCode: 'MY-BONDA' },
  { id: '8', name: 'Babycorn Fritters', price: 275, category: Category.STARTERS, shortCode: 'BC-FRIT' },
  { id: '9', name: 'Gobi Fritters', price: 275, category: Category.STARTERS, shortCode: 'GOBI-FRIT' },
  { id: '10', name: 'Paneer Fritters', price: 300, category: Category.STARTERS, shortCode: 'PAN-FRIT' },
  { id: '11', name: 'Gobi Manchurian', price: 300, category: Category.STARTERS, shortCode: 'GOBI-MAN' },
  { id: '12', name: 'Babycorn Manchurian', price: 300, category: Category.STARTERS, shortCode: 'BC-MAN' },
  { id: '13', name: 'Vegetable Manchurian', price: 300, category: Category.STARTERS, shortCode: 'VEG-MAN' },
  { id: '14', name: 'Paneer Manchurian', price: 325, category: Category.STARTERS, shortCode: 'PAN-MAN' },
  { id: '15', name: 'Paneer Tikka', price: 375, category: Category.STARTERS, shortCode: 'PAN-TIKKA' },

  // Salads & Raitha
  { id: '16', name: 'Salad Platter', price: 150, category: Category.SALADS, shortCode: 'SAL-PLAT' },
  { id: '17', name: 'Cottage Cheese Bowl', price: 175, category: Category.SALADS, shortCode: 'COT-CHS' },
  { id: '18', name: 'Green Salad', price: 175, category: Category.SALADS, shortCode: 'GRN-SAL' },
  { id: '19', name: 'Cucumber Peanut Salad', price: 175, category: Category.SALADS, shortCode: 'CUC-PEA' },
  { id: '20', name: 'Pineapple Cucumber Salad', price: 175, category: Category.SALADS, shortCode: 'PINE-CUC' },
  { id: '21', name: 'Corn & Capsicum Salad', price: 175, category: Category.SALADS, shortCode: 'CORN-CAP' },
  { id: '22', name: 'Channa Salad', price: 175, category: Category.SALADS, shortCode: 'CHAN-SAL' },
  { id: '23', name: 'Carrogranate Salad', price: 190, category: Category.SALADS, shortCode: 'CARR-GRAN' },
  { id: '24', name: 'Raitha / Pachadi', price: 120, category: Category.SALADS, shortCode: 'RAITHA' },

  // North Indian Main Courses
  { id: '25', name: 'Kadai Sabji', price: 300, category: Category.NORTH_INDIAN, shortCode: 'KADAI-SAB' },
  { id: '26', name: 'Channa Masala', price: 300, category: Category.NORTH_INDIAN, shortCode: 'CHAN-MAS' },
  { id: '27', name: 'Green Peas Masala', price: 300, category: Category.NORTH_INDIAN, shortCode: 'PEAS-MAS' },
  { id: '28', name: 'Stuffed Capsicum', price: 300, category: Category.NORTH_INDIAN, shortCode: 'STUF-CAP' },
  { id: '29', name: 'Banarasi Aloo', price: 300, category: Category.NORTH_INDIAN, shortCode: 'BAN-ALOO' },
  { id: '30', name: 'Aloo (Gobi/Peas/Capsicum)', price: 300, category: Category.NORTH_INDIAN, shortCode: 'ALOO-VAR' },
  { id: '31', name: 'Malai Kofta', price: 325, category: Category.NORTH_INDIAN, shortCode: 'MAL-KOF' },
  { id: '32', name: 'Corn and Peas Masala', price: 325, category: Category.NORTH_INDIAN, shortCode: 'CORN-PEAS' },
  { id: '33', name: 'Methi Malai Matar', price: 325, category: Category.NORTH_INDIAN, shortCode: 'METHI-MAT' },
  { id: '34', name: 'Methi Malai Corn', price: 325, category: Category.NORTH_INDIAN, shortCode: 'METHI-CORN' },
  { id: '35', name: 'Navarathna Kurma', price: 325, category: Category.NORTH_INDIAN, shortCode: 'NAV-KUR' },
  { id: '36', name: 'Kaju Makkanwala', price: 395, category: Category.NORTH_INDIAN, shortCode: 'KAJU-MAK' },
  { id: '37', name: 'Tadka Tur', price: 260, category: Category.NORTH_INDIAN, shortCode: 'TADKA-TUR' },
  { id: '38', name: 'Dal Makhini', price: 300, category: Category.NORTH_INDIAN, shortCode: 'DAL-MAKH' },
  { id: '39', name: 'Kadai Paneer', price: 320, category: Category.NORTH_INDIAN, shortCode: 'KADAI-PAN' },
  { id: '40', name: 'Paneer Butter Masala', price: 320, category: Category.NORTH_INDIAN, shortCode: 'PBM' },
  { id: '41', name: 'Matar Paneer', price: 320, category: Category.NORTH_INDIAN, shortCode: 'MAT-PAN' },
  { id: '42', name: 'Palak Paneer', price: 320, category: Category.NORTH_INDIAN, shortCode: 'PALAK-PAN' },
  { id: '43', name: 'Paneer Makkanwala', price: 320, category: Category.NORTH_INDIAN, shortCode: 'PAN-MAK' },
  { id: '44', name: 'Malai Paneer', price: 340, category: Category.NORTH_INDIAN, shortCode: 'MAL-PAN' },
  { id: '45', name: 'Kaju Paneer', price: 375, category: Category.NORTH_INDIAN, shortCode: 'KAJU-PAN' },

  // Pulao / Rice Dishes
  { id: '46', name: 'Annalakshmi Pulao', price: 400, category: Category.RICE, shortCode: 'ANN-PUL' },
  { id: '47', name: 'Jeera Pulao', price: 225, category: Category.RICE, shortCode: 'JEE-PUL' },
  { id: '48', name: 'Corn Capsicum Pulao', price: 260, category: Category.RICE, shortCode: 'CORN-CAP-P' },
  { id: '49', name: 'Paneer Pulao', price: 260, category: Category.RICE, shortCode: 'PAN-PUL' },
  { id: '50', name: 'Vegetable Pulao', price: 260, category: Category.RICE, shortCode: 'VEG-PUL' },
  { id: '51', name: 'Vegetable Fried Rice', price: 260, category: Category.RICE, shortCode: 'VEG-FR-RI' },
  { id: '52', name: 'Burnt Garlic Fried Rice', price: 275, category: Category.RICE, shortCode: 'GAR-FR-RI' },
  { id: '53', name: 'Kashmiri Pulao', price: 350, category: Category.RICE, shortCode: 'KASH-PUL' },
  { id: '54', name: 'Kaju Pulao', price: 350, category: Category.RICE, shortCode: 'KAJU-PUL' },

  // Indian Breads
  { id: '55', name: 'Channa Bhatura (2)', price: 200, category: Category.BREADS, shortCode: 'CHAN-BHAT' },
  { id: '56', name: 'Poori Channa (4)', price: 200, category: Category.BREADS, shortCode: 'POORI-CHA' },
  { id: '57', name: 'Butter Naan', price: 90, category: Category.BREADS, shortCode: 'BUT-NAAN' },
  { id: '58', name: 'Naan (Garlic/Cheese)', price: 110, category: Category.BREADS, shortCode: 'NAAN-VAR' },
  { id: '59', name: 'Cashew Nut Naan', price: 150, category: Category.BREADS, shortCode: 'KAJU-NAAN' },
  { id: '60', name: 'Kashmiri Naan', price: 180, category: Category.BREADS, shortCode: 'KASH-NAAN' },
  { id: '61', name: 'Kulcha (Paneer/Veg)', price: 115, category: Category.BREADS, shortCode: 'KULCHA' },
  { id: '62', name: 'Paratha (Veg/Paneer)', price: 115, category: Category.BREADS, shortCode: 'PARATHA' },
  { id: '63', name: 'Rumali Roti', price: 80, category: Category.BREADS, shortCode: 'RUM-ROTI' },
  { id: '64', name: 'Tandoori Roti', price: 70, category: Category.BREADS, shortCode: 'TAN-ROTI' },
  { id: '65', name: 'Phulka', price: 50, category: Category.BREADS, shortCode: 'PHULKA' },

  // South Indian Staples
  { id: '66', name: 'Adai', price: 160, category: Category.SOUTH_INDIAN, shortCode: 'ADAI' },
  { id: '67', name: 'Kuzhi Paniyararn', price: 160, category: Category.SOUTH_INDIAN, shortCode: 'KUZHI-PAN' },
  { id: '68', name: 'Poori Masala', price: 160, category: Category.SOUTH_INDIAN, shortCode: 'POORI-MAS' },
  { id: '69', name: 'Mini Idli (Sambar/Curd)', price: 150, category: Category.SOUTH_INDIAN, shortCode: 'MINI-IDLI' },

  // Dosa Varieties
  { id: '70', name: 'Annalakshmi Dosa', price: 275, category: Category.DOSA, shortCode: 'ANN-DOSA' },
  { id: '71', name: 'Podi Dosa', price: 125, category: Category.DOSA, shortCode: 'PODI-DOSA' },
  { id: '72', name: 'Garlic Dosa', price: 150, category: Category.DOSA, shortCode: 'GAR-DOSA' },
  { id: '73', name: 'Thoku Dosa', price: 165, category: Category.DOSA, shortCode: 'THOKU-DOSA' },
  { id: '74', name: 'Mysore Masala Dosa', price: 165, category: Category.DOSA, shortCode: 'MYS-MAS' },
  { id: '75', name: 'Cheese Spread Dosa', price: 165, category: Category.DOSA, shortCode: 'CHS-DOSA' },
  { id: '76', name: 'Paneer Masala Dosa', price: 165, category: Category.DOSA, shortCode: 'PAN-MAS' },
  { id: '77', name: 'Spiced Peanut Oothapam', price: 175, category: Category.DOSA, shortCode: 'NUT-OOTH' },
  { id: '78', name: 'Pizza Oothapam', price: 200, category: Category.DOSA, shortCode: 'PIZ-OOTH' },
  { id: '79', name: 'Rava Dosa (Masala)', price: 160, category: Category.DOSA, shortCode: 'RAVA-MAS' },
  { id: '80', name: 'Onion Rava Dosa', price: 160, category: Category.DOSA, shortCode: 'ON-RAVA' },

  // Hot Beverages
  { id: '81', name: 'Indian Filter Coffee', price: 75, category: Category.HOT_BEVERAGES, shortCode: 'FIL-COFF' },
  { id: '82', name: 'Tea (Masala/Ginger)', price: 75, category: Category.HOT_BEVERAGES, shortCode: 'TEA' },
  { id: '83', name: 'Hot Chocolate', price: 150, category: Category.HOT_BEVERAGES, shortCode: 'HOT-CHOC' },
  { id: '84', name: 'Masala Doodh', price: 200, category: Category.HOT_BEVERAGES, shortCode: 'MAS-DOODH' },

  // Cold Beverages
  { id: '85', name: 'Ambrosia', price: 175, category: Category.COLD_BEVERAGES, shortCode: 'AMBROSIA' },
  { id: '86', name: 'Fresh Juice (Org/Pine)', price: 150, category: Category.COLD_BEVERAGES, shortCode: 'FR-JUICE' },
  { id: '87', name: 'Fresh Lime Soda', price: 110, category: Category.COLD_BEVERAGES, shortCode: 'FLS' },
  { id: '88', name: 'Iced Lemon Tea', price: 130, category: Category.COLD_BEVERAGES, shortCode: 'ICE-TEA' },
  { id: '89', name: 'Annalakshmi Milkshake', price: 325, category: Category.COLD_BEVERAGES, shortCode: 'ANN-SHAKE' },
  { id: '90', name: 'Cold Milo', price: 210, category: Category.COLD_BEVERAGES, shortCode: 'MILO' },
  { id: '91', name: 'Lassi (Sweet/Salt)', price: 150, category: Category.COLD_BEVERAGES, shortCode: 'LASSI' },
  { id: '92', name: 'Mango Lassi', price: 190, category: Category.COLD_BEVERAGES, shortCode: 'MAN-LASS' },
  { id: '93', name: 'Neer Moru', price: 100, category: Category.COLD_BEVERAGES, shortCode: 'NEER-MOR' },

  // Desserts
  { id: '94', name: 'Annalakshmi Delight', price: 325, category: Category.DESSERTS, shortCode: 'ANN-DEL' },
  { id: '95', name: 'Ice Cream (Scoop)', price: 130, category: Category.DESSERTS, shortCode: 'ICE-CRM' },
  { id: '96', name: 'Basant Bahaar', price: 175, category: Category.DESSERTS, shortCode: 'BAS-BAH' },
  { id: '97', name: 'Gulab Jamun', price: 125, category: Category.DESSERTS, shortCode: 'G-JAMUN' },
  { id: '98', name: 'Sweet with Ice Cream', price: 175, category: Category.DESSERTS, shortCode: 'SWT-ICE' },
];