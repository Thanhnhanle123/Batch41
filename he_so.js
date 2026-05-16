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
  // 1.21: [
  //   { tenor: 9, coef: 0.12837, minPercent: 20 },
  //   { tenor: 12, coef: 0.1004, minPercent: 20 },
  //   { tenor: 15, coef: 0.08367, minPercent: 20 },
  //   { tenor: 18, coef: 0.07256, minPercent: 20 },
  //   { tenor: 21, coef: 0.06465, minPercent: 20 },
  //   { tenor: 24, coef: 0.05874, minPercent: 20 },
  //   { tenor: 36, coef: 0.04516, minPercent: 20 },
  // ],
  // 1.51: [
  //   { tenor: 9, coef: 0.131461, minPercent: 20 },
  //   { tenor: 12, coef: 0.103484, minPercent: 20 },
  //   { tenor: 15, coef: 0.086765, minPercent: 20 },
  //   { tenor: 18, coef: 0.075684, minPercent: 20 },
  //   { tenor: 21, coef: 0.067811, minPercent: 20 },
  //   { tenor: 24, coef: 0.061945, minPercent: 20 },
  //   { tenor: 36, coef: 0.048559, minPercent: 20 },
  // ],
  // 1.78: [
  //   { tenor: 9, coef: 0.134079, minPercent: 20 },
  //   { tenor: 12, coef: 0.106095, minPercent: 20 },
  //   { tenor: 15, coef: 0.089412, minPercent: 20 },
  //   { tenor: 18, coef: 0.078378, minPercent: 20 },
  //   { tenor: 21, coef: 0.070555, minPercent: 20 },
  //   { tenor: 24, coef: 0.064745, minPercent: 20 },
  //   { tenor: 36, coef: 0.051548, minPercent: 20 },
  // ],
  // tenor:  9	12	15	18	21	24	30	36
  // coef: 0,12911	0,10114	0,08441	0,07330	0,06542	0,05951	0,05135	0,04598
  // minPercent: 20 for all 1.28 entries
  1.28: [
    { tenor: 9, coef: 0.12911, minPercent: 20 },
    { tenor: 12, coef: 0.10114, minPercent: 20 },
    { tenor: 15, coef: 0.08441, minPercent: 20 },
    { tenor: 18, coef: 0.07330, minPercent: 20 },
    { tenor: 21, coef: 0.06542, minPercent: 20 },
    { tenor: 24, coef: 0.05951, minPercent: 20 },
    { tenor: 30, coef: 0.05135, minPercent: 20 },
    { tenor: 36, coef: 0.04598, minPercent: 20 },
  ],
  // tenor:  9	12	15	18	21	24	30	36
  // coef: 0,13218	0,10422	0,08751	0,07644	0,06858	0,06273	0,05467	0,04941
  // minPercent: 20 for all 1.59 entries
  1.59: [
    { tenor: 9, coef: 0.13218, minPercent: 20 },
    { tenor: 12, coef: 0.10422, minPercent: 20 },
    { tenor: 15, coef: 0.08751, minPercent: 20 },
    { tenor: 18, coef: 0.07644, minPercent: 20 },
    { tenor: 21, coef: 0.06858, minPercent: 20 },
    { tenor: 24, coef: 0.06273, minPercent: 20 },
    { tenor: 30, coef: 0.05467, minPercent: 20 },
    { tenor: 36, coef: 0.04941, minPercent: 20 },
  ],
  // tenor:  9	12	15	18	21	24	30	36
  // coef: 0,13484	0,10682	0,09020	0,07915	0,07136	0,06554	0,05759	0,05243
  // minPercent: 20 for all 1.85 entries
  1.85: [
    { tenor: 9, coef: 0.13484, minPercent: 20 },
    { tenor: 12, coef: 0.10682, minPercent: 20 },
    { tenor: 15, coef: 0.09020, minPercent: 20 },
    { tenor: 18, coef: 0.07915, minPercent: 20 },
    { tenor: 21, coef: 0.07136, minPercent: 20 },
    { tenor: 24, coef: 0.06554, minPercent: 20 },
    { tenor: 30, coef: 0.05759, minPercent: 20 },
    { tenor: 36, coef: 0.05243, minPercent: 20 },
  ],
  1.19: [
    { tenor: 12, coef: 0.10025, minPercent: 15 },
    { tenor: 15, coef: 0.08349, minPercent: 15 },
    { tenor: 18, coef: 0.07237, minPercent: 15 },
    { tenor: 21, coef: 0.06446, minPercent: 15 },
    { tenor: 24, coef: 0.05856, minPercent: 15 },
    { tenor: 30, coef: 0.05037, minPercent: 15 },
    { tenor: 36, coef: 0.04496, minPercent: 15 },
  ]
};
