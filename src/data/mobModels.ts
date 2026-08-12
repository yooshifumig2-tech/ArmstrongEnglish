// Vanilla Bedrock entity geometry from Mojang/bedrock-samples (main).
// Normalized to the legacy cube/bone shape used by this site's Three.js renderer.
export type MobModelId = keyof typeof MOB_MODELS;

export const MOB_MODELS = {
  "zombie": {
    "texturewidth": 64,
    "textureheight": 32,
    "bones": [
      {
        "name": "body",
        "pivot": [
          0,
          24,
          0
        ],
        "cubes": [
          {
            "origin": [
              -4,
              12,
              -2
            ],
            "size": [
              8,
              12,
              4
            ],
            "uv": [
              16,
              16
            ]
          }
        ],
        "parent": "waist"
      },
      {
        "name": "waist",
        "neverRender": true,
        "pivot": [
          0,
          12,
          0
        ]
      },
      {
        "name": "head",
        "pivot": [
          0,
          24,
          0
        ],
        "cubes": [
          {
            "origin": [
              -4,
              24,
              -4
            ],
            "size": [
              8,
              8,
              8
            ],
            "uv": [
              0,
              0
            ]
          }
        ],
        "parent": "body"
      },
      {
        "name": "hat",
        "pivot": [
          0,
          24,
          0
        ],
        "cubes": [
          {
            "origin": [
              -4,
              24,
              -4
            ],
            "size": [
              8,
              8,
              8
            ],
            "uv": [
              32,
              0
            ],
            "inflate": 0.5
          }
        ],
        "neverRender": true,
        "parent": "head"
      },
      {
        "name": "rightArm",
        "pivot": [
          -5,
          22,
          0
        ],
        "cubes": [
          {
            "origin": [
              -8,
              12,
              -2
            ],
            "size": [
              4,
              12,
              4
            ],
            "uv": [
              40,
              16
            ]
          }
        ],
        "parent": "body"
      },
      {
        "name": "rightItem",
        "pivot": [
          -6,
          15,
          1
        ],
        "neverRender": true,
        "parent": "rightArm"
      },
      {
        "name": "leftArm",
        "pivot": [
          5,
          22,
          0
        ],
        "cubes": [
          {
            "origin": [
              4,
              12,
              -2
            ],
            "size": [
              4,
              12,
              4
            ],
            "uv": [
              40,
              16
            ]
          }
        ],
        "mirror": true,
        "parent": "body"
      },
      {
        "name": "leftItem",
        "pivot": [
          6,
          15,
          1
        ],
        "neverRender": true,
        "parent": "leftArm"
      },
      {
        "name": "rightLeg",
        "pivot": [
          -1.9,
          12,
          0
        ],
        "cubes": [
          {
            "origin": [
              -3.9,
              0,
              -2
            ],
            "size": [
              4,
              12,
              4
            ],
            "uv": [
              0,
              16
            ]
          }
        ],
        "parent": "body"
      },
      {
        "name": "leftLeg",
        "pivot": [
          1.9,
          12,
          0
        ],
        "cubes": [
          {
            "origin": [
              -0.1,
              0,
              -2
            ],
            "size": [
              4,
              12,
              4
            ],
            "uv": [
              0,
              16
            ]
          }
        ],
        "mirror": true,
        "parent": "body"
      }
    ]
  },
  "skeleton": {
    "texturewidth": 64,
    "textureheight": 32,
    "bones": [
      {
        "name": "body",
        "pivot": [
          0,
          24,
          0
        ],
        "cubes": [
          {
            "origin": [
              -4,
              12,
              -2
            ],
            "size": [
              8,
              12,
              4
            ],
            "uv": [
              16,
              16
            ]
          }
        ],
        "parent": "waist"
      },
      {
        "name": "waist",
        "pivot": [
          0,
          12,
          0
        ]
      },
      {
        "name": "head",
        "pivot": [
          0,
          24,
          0
        ],
        "cubes": [
          {
            "origin": [
              -4,
              24,
              -4
            ],
            "size": [
              8,
              8,
              8
            ],
            "uv": [
              0,
              0
            ]
          }
        ],
        "parent": "body"
      },
      {
        "name": "hat",
        "pivot": [
          0,
          24,
          0
        ],
        "cubes": [
          {
            "origin": [
              -4,
              24,
              -4
            ],
            "size": [
              8,
              8,
              8
            ],
            "uv": [
              32,
              0
            ],
            "inflate": 0.5
          }
        ],
        "neverRender": true,
        "parent": "head"
      },
      {
        "name": "rightArm",
        "pivot": [
          -5,
          22,
          0
        ],
        "cubes": [
          {
            "origin": [
              -6,
              12,
              -1
            ],
            "size": [
              2,
              12,
              2
            ],
            "uv": [
              40,
              16
            ]
          }
        ],
        "parent": "body"
      },
      {
        "name": "rightItem",
        "pivot": [
          -6,
          15,
          1
        ],
        "neverRender": true,
        "parent": "rightArm"
      },
      {
        "name": "leftArm",
        "pivot": [
          5,
          22,
          0
        ],
        "cubes": [
          {
            "origin": [
              4,
              12,
              -1
            ],
            "size": [
              2,
              12,
              2
            ],
            "uv": [
              40,
              16
            ]
          }
        ],
        "mirror": true,
        "parent": "body"
      },
      {
        "name": "leftItem",
        "pivot": [
          6,
          15,
          1
        ],
        "neverRender": true,
        "parent": "leftArm"
      },
      {
        "name": "rightLeg",
        "pivot": [
          -2,
          12,
          0
        ],
        "cubes": [
          {
            "origin": [
              -3,
              0,
              -1
            ],
            "size": [
              2,
              12,
              2
            ],
            "uv": [
              0,
              16
            ]
          }
        ],
        "parent": "body"
      },
      {
        "name": "leftLeg",
        "pivot": [
          2,
          12,
          0
        ],
        "cubes": [
          {
            "origin": [
              1,
              0,
              -1
            ],
            "size": [
              2,
              12,
              2
            ],
            "uv": [
              0,
              16
            ]
          }
        ],
        "mirror": true,
        "parent": "body"
      }
    ]
  },
  "creeper": {
    "texturewidth": 64,
    "textureheight": 32,
    "bones": [
      {
        "name": "body",
        "cubes": [
          {
            "origin": [
              -4,
              6,
              -2
            ],
            "size": [
              8,
              12,
              4
            ],
            "uv": [
              16,
              16
            ]
          }
        ]
      },
      {
        "name": "head",
        "parent": "body",
        "pivot": [
          0,
          18,
          0
        ],
        "cubes": [
          {
            "origin": [
              -4,
              18,
              -4
            ],
            "size": [
              8,
              8,
              8
            ],
            "uv": [
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "leg0",
        "parent": "body",
        "pivot": [
          -2,
          6,
          4
        ],
        "cubes": [
          {
            "origin": [
              -4,
              0,
              2
            ],
            "size": [
              4,
              6,
              4
            ],
            "uv": [
              0,
              16
            ]
          }
        ]
      },
      {
        "name": "leg1",
        "parent": "body",
        "pivot": [
          2,
          6,
          4
        ],
        "cubes": [
          {
            "origin": [
              0,
              0,
              2
            ],
            "size": [
              4,
              6,
              4
            ],
            "uv": [
              0,
              16
            ]
          }
        ]
      },
      {
        "name": "leg2",
        "parent": "body",
        "pivot": [
          -2,
          6,
          -4
        ],
        "cubes": [
          {
            "origin": [
              -4,
              0,
              -6
            ],
            "size": [
              4,
              6,
              4
            ],
            "uv": [
              0,
              16
            ]
          }
        ]
      },
      {
        "name": "leg3",
        "parent": "body",
        "pivot": [
          2,
          6,
          -4
        ],
        "cubes": [
          {
            "origin": [
              0,
              0,
              -6
            ],
            "size": [
              4,
              6,
              4
            ],
            "uv": [
              0,
              16
            ]
          }
        ]
      }
    ]
  },
  "enderman": {
    "texturewidth": 64,
    "textureheight": 32,
    "bones": [
      {
        "name": "hat",
        "parent": "head",
        "reset": true,
        "pivot": [
          0,
          38,
          0
        ],
        "cubes": [
          {
            "origin": [
              -4,
              37.5,
              -4
            ],
            "size": [
              8,
              8,
              8
            ],
            "uv": [
              0,
              16
            ],
            "inflate": -0.5
          }
        ],
        "neverRender": false
      },
      {
        "name": "head",
        "parent": "body",
        "pivot": [
          0,
          24,
          0
        ],
        "cubes": [
          {
            "origin": [
              -4,
              24,
              -4
            ],
            "size": [
              8,
              8,
              8
            ],
            "uv": [
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "body",
        "reset": true,
        "pivot": [
          0,
          38,
          0
        ],
        "cubes": [
          {
            "origin": [
              -4,
              26,
              -2
            ],
            "size": [
              8,
              12,
              4
            ],
            "uv": [
              32,
              16
            ]
          }
        ]
      },
      {
        "name": "rightArm",
        "parent": "body",
        "reset": true,
        "pivot": [
          -3,
          36,
          0
        ],
        "cubes": [
          {
            "origin": [
              -4,
              8,
              -1
            ],
            "size": [
              2,
              30,
              2
            ],
            "uv": [
              56,
              0
            ]
          }
        ]
      },
      {
        "name": "rightItem",
        "pivot": [
          -6,
          15,
          1
        ],
        "neverRender": true,
        "parent": "rightArm"
      },
      {
        "name": "leftArm",
        "parent": "body",
        "reset": true,
        "mirror": true,
        "pivot": [
          5,
          36,
          0
        ],
        "cubes": [
          {
            "origin": [
              4,
              8,
              -1
            ],
            "size": [
              2,
              30,
              2
            ],
            "uv": [
              56,
              0
            ]
          }
        ]
      },
      {
        "name": "rightLeg",
        "parent": "body",
        "reset": true,
        "pivot": [
          -2,
          26,
          0
        ],
        "cubes": [
          {
            "origin": [
              -3,
              -4,
              -1
            ],
            "size": [
              2,
              30,
              2
            ],
            "uv": [
              56,
              0
            ]
          }
        ]
      },
      {
        "name": "leftLeg",
        "parent": "body",
        "reset": true,
        "mirror": true,
        "pivot": [
          2,
          26,
          0
        ],
        "cubes": [
          {
            "origin": [
              1,
              -4,
              -1
            ],
            "size": [
              2,
              30,
              2
            ],
            "uv": [
              56,
              0
            ]
          }
        ]
      }
    ]
  },
  "warden": {
    "texturewidth": 128,
    "textureheight": 128,
    "bones": [
      {
        "name": "root",
        "pivot": [
          0,
          0,
          0
        ]
      },
      {
        "name": "body",
        "parent": "root",
        "pivot": [
          0,
          21,
          0
        ],
        "cubes": [
          {
            "origin": [
              -9,
              13,
              -4
            ],
            "size": [
              18,
              21,
              11
            ],
            "uv": [
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "right_ribcage",
        "parent": "body",
        "pivot": [
          -7,
          23,
          -4
        ],
        "cubes": [
          {
            "origin": [
              -9,
              13,
              -4.1
            ],
            "size": [
              9,
              21,
              0
            ],
            "uv": [
              90,
              11
            ]
          }
        ]
      },
      {
        "name": "left_ribcage",
        "parent": "body",
        "pivot": [
          7,
          23,
          -4
        ],
        "cubes": [
          {
            "origin": [
              0,
              13,
              -4.1
            ],
            "size": [
              9,
              21,
              0
            ],
            "uv": [
              90,
              11
            ],
            "mirror": true
          }
        ]
      },
      {
        "name": "head",
        "parent": "body",
        "pivot": [
          0,
          34,
          0
        ],
        "cubes": [
          {
            "origin": [
              -8,
              34,
              -5
            ],
            "size": [
              16,
              16,
              10
            ],
            "uv": [
              0,
              32
            ]
          }
        ]
      },
      {
        "name": "right_tendril",
        "parent": "head",
        "pivot": [
          -8,
          46,
          0
        ],
        "cubes": [
          {
            "origin": [
              -24,
              43,
              0
            ],
            "size": [
              16,
              16,
              0
            ],
            "uv": [
              52,
              32
            ]
          }
        ]
      },
      {
        "name": "left_tendril",
        "parent": "head",
        "pivot": [
          8,
          46,
          0
        ],
        "cubes": [
          {
            "origin": [
              8,
              43,
              0
            ],
            "size": [
              16,
              16,
              0
            ],
            "uv": [
              58,
              0
            ]
          }
        ]
      },
      {
        "name": "right_arm",
        "parent": "body",
        "pivot": [
          -13,
          34,
          1
        ],
        "cubes": [
          {
            "origin": [
              -17,
              6,
              -3
            ],
            "size": [
              8,
              28,
              8
            ],
            "uv": [
              44,
              50
            ]
          }
        ]
      },
      {
        "name": "left_arm",
        "parent": "body",
        "pivot": [
          13,
          34,
          1
        ],
        "cubes": [
          {
            "origin": [
              9,
              6,
              -3
            ],
            "size": [
              8,
              28,
              8
            ],
            "uv": [
              0,
              58
            ]
          }
        ]
      },
      {
        "name": "right_leg",
        "parent": "root",
        "pivot": [
          -5.9,
          13,
          0
        ],
        "cubes": [
          {
            "origin": [
              -9,
              0,
              -3
            ],
            "size": [
              6,
              13,
              6
            ],
            "uv": [
              76,
              48
            ]
          }
        ]
      },
      {
        "name": "left_leg",
        "parent": "root",
        "pivot": [
          5.9,
          13,
          0
        ],
        "cubes": [
          {
            "origin": [
              3,
              0,
              -3
            ],
            "size": [
              6,
              13,
              6
            ],
            "uv": [
              76,
              76
            ]
          }
        ]
      }
    ]
  },
  "ender_dragon": {
    "texturewidth": 256,
    "textureheight": 256,
    "bones": [
      {
        "name": "root",
        "pivot": [
          0,
          24,
          0
        ]
      },
      {
        "name": "head",
        "pivot": [
          0,
          24,
          0
        ],
        "cubes": [
          {
            "origin": [
              -6,
              20,
              -24
            ],
            "size": [
              12,
              5,
              16
            ],
            "uv": [
              176,
              44
            ]
          },
          {
            "origin": [
              -8,
              16,
              -10
            ],
            "size": [
              16,
              16,
              16
            ],
            "uv": [
              112,
              30
            ]
          },
          {
            "mirror": true,
            "origin": [
              -5,
              32,
              -4
            ],
            "size": [
              2,
              4,
              6
            ],
            "uv": [
              0,
              0
            ]
          },
          {
            "mirror": true,
            "origin": [
              -5,
              25,
              -22
            ],
            "size": [
              2,
              2,
              4
            ],
            "uv": [
              112,
              0
            ]
          },
          {
            "origin": [
              3,
              32,
              -4
            ],
            "size": [
              2,
              4,
              6
            ],
            "uv": [
              0,
              0
            ]
          },
          {
            "origin": [
              3,
              25,
              -22
            ],
            "size": [
              2,
              2,
              4
            ],
            "uv": [
              112,
              0
            ]
          }
        ]
      },
      {
        "name": "jaw",
        "parent": "head",
        "pivot": [
          0,
          20,
          -8
        ],
        "cubes": [
          {
            "origin": [
              -6,
              16,
              -24
            ],
            "size": [
              12,
              4,
              16
            ],
            "uv": [
              176,
              65
            ]
          }
        ]
      },
      {
        "name": "neck",
        "pivot": [
          0,
          24,
          0
        ],
        "cubes": [
          {
            "origin": [
              -5,
              19,
              -5
            ],
            "size": [
              10,
              10,
              10
            ],
            "uv": [
              192,
              104
            ]
          },
          {
            "origin": [
              -1,
              29,
              -3
            ],
            "size": [
              2,
              4,
              6
            ],
            "uv": [
              48,
              0
            ]
          }
        ]
      },
      {
        "name": "body",
        "pivot": [
          0,
          20,
          8
        ],
        "cubes": [
          {
            "origin": [
              -12,
              -4,
              -8
            ],
            "size": [
              24,
              24,
              64
            ],
            "uv": [
              0,
              0
            ]
          },
          {
            "origin": [
              -1,
              20,
              -2
            ],
            "size": [
              2,
              6,
              12
            ],
            "uv": [
              220,
              53
            ]
          },
          {
            "origin": [
              -1,
              20,
              18
            ],
            "size": [
              2,
              6,
              12
            ],
            "uv": [
              220,
              53
            ]
          },
          {
            "origin": [
              -1,
              20,
              38
            ],
            "size": [
              2,
              6,
              12
            ],
            "uv": [
              220,
              53
            ]
          }
        ]
      },
      {
        "name": "wing",
        "pivot": [
          -12,
          19,
          2
        ],
        "cubes": [
          {
            "origin": [
              -68,
              15,
              -2
            ],
            "size": [
              56,
              8,
              8
            ],
            "uv": [
              112,
              88
            ]
          },
          {
            "origin": [
              -68,
              19,
              4
            ],
            "size": [
              56,
              0,
              56
            ],
            "uv": [
              -56,
              88
            ]
          }
        ]
      },
      {
        "name": "wingtip",
        "pivot": [
          -56,
          24,
          0
        ],
        "cubes": [
          {
            "origin": [
              -112,
              22,
              -2
            ],
            "size": [
              56,
              4,
              4
            ],
            "uv": [
              112,
              136
            ]
          },
          {
            "origin": [
              -112,
              24,
              2
            ],
            "size": [
              56,
              0,
              56
            ],
            "uv": [
              -56,
              144
            ]
          }
        ]
      },
      {
        "name": "wing1",
        "pivot": [
          12,
          19,
          2
        ],
        "cubes": [
          {
            "origin": [
              -44,
              15,
              -2
            ],
            "size": [
              56,
              8,
              8
            ],
            "uv": [
              112,
              88
            ]
          },
          {
            "origin": [
              -44,
              19,
              4
            ],
            "size": [
              56,
              0,
              56
            ],
            "uv": [
              -56,
              88
            ]
          }
        ]
      },
      {
        "name": "wingtip1",
        "pivot": [
          -56,
          24,
          0
        ],
        "cubes": [
          {
            "origin": [
              -112,
              22,
              -2
            ],
            "size": [
              56,
              4,
              4
            ],
            "uv": [
              112,
              136
            ]
          },
          {
            "origin": [
              -112,
              24,
              2
            ],
            "size": [
              56,
              0,
              56
            ],
            "uv": [
              -56,
              144
            ]
          }
        ]
      },
      {
        "name": "rearleg",
        "pivot": [
          -16,
          8,
          42
        ],
        "cubes": [
          {
            "origin": [
              -24,
              -20,
              34
            ],
            "size": [
              16,
              32,
              16
            ],
            "uv": [
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "rearleg1",
        "pivot": [
          16,
          8,
          42
        ],
        "cubes": [
          {
            "origin": [
              8,
              -20,
              34
            ],
            "size": [
              16,
              32,
              16
            ],
            "uv": [
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "frontleg",
        "pivot": [
          -12,
          4,
          2
        ],
        "cubes": [
          {
            "origin": [
              -16,
              -16,
              -2
            ],
            "size": [
              8,
              24,
              8
            ],
            "uv": [
              112,
              104
            ]
          }
        ]
      },
      {
        "name": "frontleg1",
        "pivot": [
          12,
          4,
          2
        ],
        "cubes": [
          {
            "origin": [
              8,
              -16,
              -2
            ],
            "size": [
              8,
              24,
              8
            ],
            "uv": [
              112,
              104
            ]
          }
        ]
      },
      {
        "name": "rearlegtip",
        "pivot": [
          0,
          -8,
          -4
        ],
        "cubes": [
          {
            "origin": [
              -6,
              -38,
              -4
            ],
            "size": [
              12,
              32,
              12
            ],
            "uv": [
              196,
              0
            ]
          }
        ]
      },
      {
        "name": "rearlegtip1",
        "pivot": [
          0,
          -8,
          -4
        ],
        "cubes": [
          {
            "origin": [
              -6,
              -38,
              -4
            ],
            "size": [
              12,
              32,
              12
            ],
            "uv": [
              196,
              0
            ]
          }
        ]
      },
      {
        "name": "frontlegtip",
        "pivot": [
          0,
          4,
          -1
        ],
        "cubes": [
          {
            "origin": [
              -3,
              -19,
              -4
            ],
            "size": [
              6,
              24,
              6
            ],
            "uv": [
              226,
              138
            ]
          }
        ]
      },
      {
        "name": "frontlegtip1",
        "pivot": [
          0,
          4,
          -1
        ],
        "cubes": [
          {
            "origin": [
              -3,
              -19,
              -4
            ],
            "size": [
              6,
              24,
              6
            ],
            "uv": [
              226,
              138
            ]
          }
        ]
      },
      {
        "name": "rearfoot",
        "pivot": [
          0,
          -7,
          4
        ],
        "cubes": [
          {
            "origin": [
              -9,
              -13,
              -16
            ],
            "size": [
              18,
              6,
              24
            ],
            "uv": [
              112,
              0
            ]
          }
        ]
      },
      {
        "name": "rearfoot1",
        "pivot": [
          0,
          -7,
          4
        ],
        "cubes": [
          {
            "origin": [
              -9,
              -13,
              -16
            ],
            "size": [
              18,
              6,
              24
            ],
            "uv": [
              112,
              0
            ]
          }
        ]
      },
      {
        "name": "frontfoot",
        "pivot": [
          0,
          1,
          0
        ],
        "cubes": [
          {
            "origin": [
              -4,
              -3,
              -12
            ],
            "size": [
              8,
              4,
              16
            ],
            "uv": [
              144,
              104
            ]
          }
        ]
      },
      {
        "name": "frontfoot1",
        "pivot": [
          0,
          1,
          0
        ],
        "cubes": [
          {
            "origin": [
              -4,
              -3,
              -12
            ],
            "size": [
              8,
              4,
              16
            ],
            "uv": [
              144,
              104
            ]
          }
        ]
      }
    ]
  }
} as const;

