// HE_SO coefficients moved out from index.html
// New flexible format:
// HE_SO[package] = [ { tenor: <months>, coef: <number>, minPercent: <min downpay %>, maxPercent: <max downpay %> }, ... ]
// minPercent / maxPercent are optional; when absent the entry is considered available for any percent.
// Backward compatibility: if HE_SO[package] is an object mapping tenor->coef, code will still handle it.
const HE_SO = {
  0.99: [
    { tenor: 9, coef: 0.126179, minPercent: 0, maxPercent: 19 },
    { tenor: 12, coef: 0.098233, minPercent: 0, maxPercent: 19 },
    { tenor: 15, coef: 0.081497, minPercent: 0, maxPercent: 19 }, 
    { tenor: 9, coef: 0.126179, minPercent: 20  },
    { tenor: 12, coef: 0.098233, minPercent: 20  },
    { tenor: 15, coef: 0.081497, minPercent: 20 },
    { tenor: 18, coef: 0.070365, minPercent: 20 },
    { tenor: 21, coef: 0.06244, minPercent: 20 },
    { tenor: 24, coef: 0.05651, minPercent: 20 },
    // 36 can be added similarly when needed
  ],
  1.21: [
    { tenor: 9, coef: 0.12837, minPercent: 20 },
    { tenor: 12, coef: 0.1004, minPercent: 20 },
    { tenor: 15, coef: 0.08367, minPercent: 20 },
    { tenor: 18, coef: 0.07256, minPercent: 20 },
    { tenor: 21, coef: 0.06465, minPercent: 20 },
    { tenor: 24, coef: 0.05874, minPercent: 20 },
    { tenor: 36, coef: 0.04516, minPercent: 20 },
  ],
  1.51: [
    { tenor: 9, coef: 0.131461, minPercent: 20 },
    { tenor: 12, coef: 0.103484, minPercent: 20 },
    { tenor: 15, coef: 0.086765, minPercent: 20 },
    { tenor: 18, coef: 0.075684, minPercent: 20 },
    { tenor: 21, coef: 0.067811, minPercent: 20 },
    { tenor: 24, coef: 0.061945, minPercent: 20 },
    { tenor: 36, coef: 0.048559, minPercent: 20 },
  ],
  1.78: [
    { tenor: 9, coef: 0.134079, minPercent: 20 },
    { tenor: 12, coef: 0.106095, minPercent: 20 },
    { tenor: 15, coef: 0.089412, minPercent: 20 },
    { tenor: 18, coef: 0.078378, minPercent: 20 },
    { tenor: 21, coef: 0.070555, minPercent: 20 },
    { tenor: 24, coef: 0.064745, minPercent: 20 },
    { tenor: 36, coef: 0.051548, minPercent: 20 },
  ],
};
