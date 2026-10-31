/**
 * ==============================
 * DOCUMENT RULE CONFIG
 * ==============================
 *
 * minFA = khoản vay tối thiểu
 * maxFA = khoản vay tối đa
 *
 * minDP = % trả trước tối thiểu
 * maxDP = % trả trước tối đa
 *
 * documents = danh sách chứng từ cần bổ sung
 *
 * vehicleRules:
 * - low_risk = dòng xe rủi ro thấp
 * - normal   = dòng xe thông thường
 *
 * ==============================
 * QUY TẮC:
 * ==============================
 *
 * 1. FA >= 80 triệu
 *
 *    DP >= 50%
 *    => CCCD
 *
 *    30% <= DP < 50%
 *    => CCCD + POA + POI
 *
 *    DP < 30%
 *    => CCCD + POA + POI + Field check
 *
 * ------------------------------------------------
 *
 * 2. 50 triệu <= FA < 80 triệu
 *
 *    LOW RISK:
 *      DP < 30%
 *      => CCCD + POA + POI
 *
 *      DP >= 30%
 *      => CCCD
 *
 *    NORMAL:
 *      DP < 50%
 *      => CCCD + POA + POI
 *
 *      DP >= 50%
 *      => CCCD
 *
 * ------------------------------------------------
 *
 * 3. 35 triệu <= FA < 50 triệu
 *
 *    DP < 10%
 *    => CCCD + POA/BHYT/GPLX + Field check
 *
 *    DP >= 10%
 *    => CCCD
 *
 * ------------------------------------------------
 *
 * 4. FA < 35 triệu
 *
 *    => CCCD
 *
 * ==============================
 */

const DOCUMENT_RULES = [

  /**
   * ==========================================
   * FA >= 80 triệu
   * ==========================================
   */
  {
    minFA: 80000000,
    maxFA: Infinity,

    conditions: [

      /**
       * DP >= 50%
       * => chỉ cần CCCD
       */
      {
        minDP: 50,
        documents: ['CCCD']
      },

      /**
       * 30% <= DP < 50%
       * => cần POA + POI
       */
      {
        minDP: 30,
        maxDP: 49.99,
        documents: ['CCCD', 'POA', 'POI']
      },

      /**
       * DP < 30%
       * => cần Field check
       */
      {
        maxDP: 29.99,
        documents: ['CCCD', 'POA', 'POI', 'Field check']
      }
    ]
  },

  /**
   * ==========================================
   * 50 triệu <= FA < 80 triệu
   * ==========================================
   */
  {
    minFA: 50000000,
    maxFA: 79999999,

    vehicleRules: {

      /**
       * LOW RISK VEHICLE
       */
      low_risk: [

        /**
         * DP < 30%
         * => cần POA + POI
         */
        {
          maxDP: 29.99,
          documents: ['CCCD', 'POA', 'POI']
        },

        /**
         * DP >= 30%
         * => chỉ cần CCCD
         */
        {
          minDP: 30,
          documents: ['CCCD']
        }
      ],

      /**
       * NORMAL VEHICLE
       */
      normal: [

        /**
         * DP < 50%
         * => cần POA + POI
         */
        {
          maxDP: 49.99,
          documents: ['CCCD', 'POA', 'POI']
        },

        /**
         * DP >= 50%
         * => chỉ cần CCCD
         */
        {
          minDP: 50,
          documents: ['CCCD']
        }
      ]
    }
  },

  /**
   * ==========================================
   * 35 triệu <= FA < 50 triệu
   * ==========================================
   */
  {
    minFA: 35000000,
    maxFA: 49999999,

    conditions: [

      /**
       * DP < 10%
       * => cần bổ sung giấy tờ + Field check
       */
      {
        maxDP: 9.99,
        documents: ['CCCD', 'POA/BHYT/GPLX', 'Field check']
      },

      /**
       * DP >= 10%
       * => chỉ cần CCCD
       */
      {
        minDP: 10,
        documents: ['CCCD']
      }
    ]
  },

  /**
   * ==========================================
   * FA < 35 triệu
   * ==========================================
   */
  {
    minFA: 0,
    maxFA: 34999999,

    conditions: [
      {
        documents: ['CCCD']
      }
    ]
  }
];