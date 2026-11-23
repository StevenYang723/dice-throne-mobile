// Factual card data. Chinese labels are explanatory translations.
export const COMMON_CARDS = [
  {
    "number": 1,
    "id": "transference",
    "en": "Transference!",
    "name": "状态转移",
    "cost": 2,
    "timing": "main",
    "target": "twoDifferentPlayers",
    "copies": 1,
    "effects": [
      "选择任意玩家身上的 1 枚状态标记，将其转移给另一名玩家。"
    ],
    "mechanics": {
      "operation": "transferStatus",
      "tokenCount": 1,
      "source": "anyPlayer",
      "destination": "anotherPlayer",
      "allowPositive": true,
      "allowNegative": true,
      "allowCompanions": false,
      "obeyUnmovableTokens": true
    },
    "sources": [
      "https://dice-throne.rulepop.com/components/card-transference.webp",
      "https://dice-throne.rulepop.com/#status-effects",
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf"
    ],
    "photoVerified": true,
    "phase": "main",
    "text": "选择任意玩家身上的 1 枚状态标记，将其转移给另一名玩家。",
    "chooseStatus": true,
    "ops": [
      [
        "transferChosen"
      ]
    ]
  },
  {
    "number": 2,
    "id": "what-status-effects",
    "en": "What Status Effects?",
    "name": "清除全部状态",
    "cost": 2,
    "timing": "main",
    "target": "anyPlayer",
    "copies": 1,
    "effects": [
      "移除一名所选玩家身上所有可以移除的状态标记，包括正面和负面状态的全部层数。"
    ],
    "mechanics": {
      "operation": "removeStatuses",
      "tokenCount": "all",
      "allTypes": true,
      "allowPositive": true,
      "allowNegative": true,
      "allowCompanions": false,
      "obeyUnremovableTokens": true
    },
    "sources": [
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf",
      "https://dice-throne.rulepop.com/#faq"
    ],
    "phase": "main",
    "text": "移除一名所选玩家身上所有可以移除的状态标记，包括正面和负面状态的全部层数。",
    "chooseStatus": true,
    "ops": [
      [
        "removeAllChosen"
      ]
    ]
  },
  {
    "number": 3,
    "id": "vegas-baby",
    "en": "Vegas Baby!",
    "name": "赌城好运",
    "cost": 0,
    "timing": "main",
    "target": "self",
    "copies": 1,
    "effects": [
      "掷 1 颗骰，获得点数一半的 CP，向上取整。"
    ],
    "mechanics": {
      "operation": "rollForCP",
      "dice": 1,
      "formula": [
        "ceil",
        [
          "div",
          [
            "sum",
            "r"
          ],
          2
        ]
      ]
    },
    "sources": [
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf"
    ],
    "ops": [
      [
        "roll",
        1,
        "r"
      ],
      [
        "cp",
        [
          "ceil",
          [
            "div",
            [
              "sum",
              "r"
            ],
            2
          ]
        ]
      ]
    ],
    "notes": [
      "发生在主要阶段；通常只能用即时改骰效果（如 Tip It）修改这一骰，不能使用仅投骰阶段可用的 Six-it。"
    ],
    "phase": "main",
    "text": "掷 1 颗骰，获得点数一半的 CP，向上取整。"
  },
  {
    "number": 4,
    "id": "get-that-outta-here",
    "en": "Get That Outta Here!",
    "name": "移除状态",
    "cost": 1,
    "timing": "main",
    "target": "anyPlayer",
    "copies": 1,
    "effects": [
      "移除一名所选玩家身上的 1 枚可移除状态标记。"
    ],
    "mechanics": {
      "operation": "removeStatus",
      "tokenCount": 1,
      "allowPositive": true,
      "allowNegative": true,
      "allowCompanions": false,
      "obeyUnremovableTokens": true
    },
    "sources": [
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf"
    ],
    "phase": "main",
    "text": "移除一名所选玩家身上的 1 枚可移除状态标记。",
    "chooseStatus": true,
    "ops": [
      [
        "removeChosen"
      ]
    ]
  },
  {
    "number": 5,
    "id": "triple-up",
    "en": "Triple Up!",
    "name": "抽三张",
    "cost": 2,
    "timing": "instant",
    "target": "self",
    "copies": 1,
    "effects": [
      "抽 3 张牌。"
    ],
    "mechanics": {
      "operation": "draw",
      "count": 3
    },
    "sources": [
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf",
      "https://dice-throne.rulepop.com/#faq"
    ],
    "ops": [
      [
        "draw",
        3
      ]
    ],
    "phase": "instant",
    "text": "抽 3 张牌。"
  },
  {
    "number": 6,
    "id": "double-up",
    "en": "Double Up!",
    "name": "抽两张",
    "cost": 1,
    "timing": "instant",
    "target": "self",
    "copies": 1,
    "effects": [
      "抽 2 张牌。"
    ],
    "mechanics": {
      "operation": "draw",
      "count": 2
    },
    "sources": [
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf",
      "https://dice-throne.rulepop.com/#faq"
    ],
    "ops": [
      [
        "draw",
        2
      ]
    ],
    "phase": "instant",
    "text": "抽 2 张牌。"
  },
  {
    "number": 7,
    "id": "buh-bye",
    "en": "Buh, Bye!",
    "name": "即时移除",
    "cost": 2,
    "timing": "instant",
    "target": "anyPlayer",
    "copies": 1,
    "effects": [
      "移除一名所选玩家身上的 1 枚可移除状态标记。"
    ],
    "mechanics": {
      "operation": "removeStatus",
      "tokenCount": 1,
      "allowPositive": true,
      "allowNegative": true,
      "allowCompanions": false,
      "obeyUnremovableTokens": true
    },
    "sources": [
      "https://dice-throne.rulepop.com/components/card-buh-bye.webp",
      "https://dice-throne.rulepop.com/#timing",
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf"
    ],
    "photoVerified": true,
    "notes": [
      "这是移除 1 枚标记，不是移除某一种状态的整叠。",
      "普通对局保留这张牌；2026 年赛事禁用与 2027 年恢复属于赛事环境，不应自动修改原版休闲牌组。"
    ],
    "phase": "instant",
    "text": "移除一名所选玩家身上的 1 枚可移除状态标记。",
    "chooseStatus": true,
    "ops": [
      [
        "removeChosen"
      ]
    ]
  },
  {
    "number": 8,
    "id": "tip-it",
    "en": "Tip It!",
    "name": "拨动一点",
    "cost": 1,
    "timing": "instant",
    "target": "anyDie",
    "copies": 1,
    "effects": [
      "将任意 1 颗骰的点数增加或减少 1；1 不能减，6 不能加，不能首尾循环。"
    ],
    "mechanics": {
      "operation": "adjustDie",
      "diceCount": 1,
      "scope": "any",
      "deltaOptions": [
        -1,
        1
      ],
      "minimum": 1,
      "maximum": 6,
      "wrap": false
    },
    "sources": [
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf"
    ],
    "notes": [
      "即时牌；能改自己或对手的骰，合法非投骰阶段的额外骰也可以改。"
    ],
    "phase": "instant",
    "text": "将任意 1 颗骰的点数增加或减少 1；1 不能减，6 不能加，不能首尾循环。",
    "targetDice": true,
    "anyDice": true,
    "chooseDelta": true,
    "ops": [
      [
        "adjustDie",
        [
          "choice",
          "delta",
          1
        ]
      ]
    ]
  },
  {
    "number": 9,
    "id": "getting-paid",
    "en": "Getting Paid!",
    "name": "获得报酬",
    "cost": 0,
    "timing": "instant",
    "target": "self",
    "copies": 1,
    "effects": [
      "获得 2 CP。"
    ],
    "mechanics": {
      "operation": "gainCP",
      "amount": 2
    },
    "sources": [
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf"
    ],
    "ops": [
      [
        "cp",
        2
      ]
    ],
    "phase": "instant",
    "text": "获得 2 CP。"
  },
  {
    "number": 10,
    "id": "not-this-time",
    "en": "Not This Time!",
    "name": "这次休想",
    "cost": 1,
    "timing": "roll",
    "target": "anyPlayerWithIncomingDamage",
    "copies": 1,
    "effects": [
      "一名所选玩家防止 6 点即将受到的伤害。"
    ],
    "mechanics": {
      "operation": "preventDamage",
      "amount": 6,
      "canTargetSelf": true,
      "canTargetOtherPlayer": true,
      "forbiddenDamageTypes": [
        "ultimate"
      ]
    },
    "sources": [
      "https://dice-throne.rulepop.com/components/card-not-this-time.webp",
      "https://dice-throne.rulepop.com/#faq",
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf"
    ],
    "ops": [
      [
        "prevent",
        6
      ]
    ],
    "photoVerified": true,
    "notes": [
      "投骰阶段牌，不是即时牌；不能在维持阶段抵消中毒伤害，也不能响应终极。"
    ],
    "phase": "defense",
    "text": "一名所选玩家防止 6 点即将受到的伤害。"
  },
  {
    "number": 11,
    "id": "twice-as-wild",
    "en": "Twice As Wild!",
    "name": "双重任意",
    "cost": 3,
    "timing": "roll",
    "target": "anyTwoDice",
    "copies": 1,
    "effects": [
      "将任意 2 颗骰分别改成自己指定的点数。"
    ],
    "mechanics": {
      "operation": "setDice",
      "diceCount": 2,
      "scope": "any",
      "minimum": 1,
      "maximum": 6,
      "distinctDice": true,
      "allowMixedOwners": true
    },
    "sources": [
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf"
    ],
    "notes": [
      "可以改变对手的骰；两颗骰可属于不同玩家。"
    ],
    "phase": "roll",
    "text": "将任意 2 颗骰分别改成自己指定的点数。",
    "targetDice": true,
    "anyDice": true,
    "chooseValue": true,
    "secondDice": true,
    "ops": [
      [
        "doubleWild"
      ]
    ]
  },
  {
    "number": 12,
    "id": "try-try-again",
    "en": "Try, Try Again!",
    "name": "再试两次",
    "cost": 1,
    "timing": "roll",
    "target": "selfOrTeammateDice",
    "copies": 1,
    "effects": [
      "自己或一名所选队友最多重掷 2 次骰；可以先后重掷同一颗两次，也可重掷两颗不同骰。"
    ],
    "mechanics": {
      "operation": "sequentialRerolls",
      "maximum": 2,
      "scope": "selfOrTeammate",
      "allowSameDieTwice": true,
      "allowEnemy": false,
      "countsAsRollAttempt": false
    },
    "sources": [
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf",
      "https://dice-throne.rulepop.com/#faq"
    ],
    "notes": [
      "不能改对手骰；第一次重掷结果已知后，允许决定第二次重掷的骰。"
    ],
    "phase": "roll",
    "text": "自己或一名所选队友最多重掷 2 次骰；可以先后重掷同一颗两次，也可重掷两颗不同骰。",
    "targetDice": true,
    "rerollTwice": true,
    "ops": [
      [
        "rerollSelected"
      ]
    ]
  },
  {
    "number": 13,
    "id": "so-wild",
    "en": "So Wild!",
    "name": "任意点数",
    "cost": 2,
    "timing": "roll",
    "target": "anyDie",
    "copies": 1,
    "effects": [
      "将任意 1 颗骰改成自己指定的点数。"
    ],
    "mechanics": {
      "operation": "setDice",
      "diceCount": 1,
      "scope": "any",
      "minimum": 1,
      "maximum": 6
    },
    "sources": [
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf"
    ],
    "phase": "roll",
    "text": "将任意 1 颗骰改成自己指定的点数。",
    "targetDice": true,
    "anyDice": true,
    "chooseValue": true,
    "ops": [
      [
        "changeDie",
        [
          "choice",
          "value",
          6
        ]
      ]
    ]
  },
  {
    "number": 14,
    "id": "samesies",
    "en": "Samesies!",
    "name": "变成相同",
    "cost": 1,
    "timing": "roll",
    "target": "ownDice",
    "copies": 1,
    "effects": [
      "将自己的 1 颗骰改为自己的另一颗骰的点数；这两颗骰必须在同一阶段、为同一目的掷出。"
    ],
    "mechanics": {
      "operation": "copyDie",
      "scope": "own",
      "sourceAndDestinationDifferent": true,
      "samePhase": true,
      "samePurpose": true,
      "allowEnemy": false
    },
    "sources": [
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf",
      "https://dice-throne.rulepop.com/#faq"
    ],
    "notes": [
      "复制数字，不是只复制符号；不能拿进攻骰去匹配额外伤害骰或防御骰。"
    ],
    "phase": "roll",
    "text": "将自己的 1 颗骰改为自己的另一颗骰的点数；这两颗骰必须在同一阶段、为同一目的掷出。",
    "targetDice": true,
    "copyDice": true,
    "ops": [
      [
        "copyDie"
      ]
    ]
  },
  {
    "number": 15,
    "id": "one-more-time",
    "en": "One More Time!",
    "name": "再投一次",
    "cost": 1,
    "timing": "roll",
    "target": "activeOffensivePlayer",
    "copies": 1,
    "effects": [
      "所选玩家可在自己的进攻投骰阶段追加 1 次投骰机会，选择至多 5 颗进攻骰重掷。"
    ],
    "mechanics": {
      "operation": "extraOffensiveRollAttempt",
      "maximumDice": 5,
      "attempts": 1,
      "recipientMayDecline": true,
      "countsAsRollAttempt": true
    },
    "sources": [
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf",
      "https://dice-throne.rulepop.com/#faq"
    ],
    "notes": [
      "不能强迫对手重掷；只作用于决定进攻技能的骰，不作用于技能激活后另外掷的伤害骰。",
      "是额外投骰机会，会触发按投骰机会计数的规则，如荆棘藤。"
    ],
    "phase": "roll",
    "text": "所选玩家可在自己的进攻投骰阶段追加 1 次投骰机会，选择至多 5 颗进攻骰重掷。",
    "offenseOnly": true,
    "ops": [
      [
        "extraRoll",
        1
      ]
    ]
  },
  {
    "number": 16,
    "id": "helping-hand",
    "en": "Helping Hand!",
    "name": "干扰之手",
    "cost": 1,
    "timing": "roll",
    "target": "opponentDie",
    "copies": 1,
    "effects": [
      "选择对手的 1 颗骰，强制其重掷。"
    ],
    "mechanics": {
      "operation": "forceReroll",
      "diceCount": 1,
      "scope": "opponent",
      "recipientMayDecline": false,
      "countsAsRollAttempt": false
    },
    "sources": [
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf"
    ],
    "phase": "roll",
    "text": "选择对手的 1 颗骰，强制其重掷。",
    "targetDice": true,
    "anyDice": true,
    "opponentDice": true,
    "ops": [
      [
        "rerollSelected"
      ]
    ]
  },
  {
    "number": 17,
    "id": "better-d",
    "en": "Better D!",
    "name": "再防一次",
    "cost": 0,
    "timing": "roll",
    "target": "defendingPlayer",
    "copies": 1,
    "effects": [
      "所选玩家可在自己的防御投骰阶段，追加 1 次防御投骰机会，选择其防御骰中的至多 5 颗重掷。"
    ],
    "mechanics": {
      "operation": "extraDefensiveRollAttempt",
      "maximumDice": 5,
      "attempts": 1,
      "recipientMayDecline": true,
      "countsAsRollAttempt": true
    },
    "sources": [
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf",
      "https://dice-throne.rulepop.com/#faq"
    ],
    "notes": [
      "不会把防御骰数量补到 5，仍限于角色本来拥有的防御骰；不能在不可防御/纯粹/终极攻击下凭空建立防御。",
      "不是再结算一次防御；保留最终防御骰，只结算一次防御技能。"
    ],
    "phase": "roll",
    "text": "所选玩家可在自己的防御投骰阶段，追加 1 次防御投骰机会，选择其防御骰中的至多 5 颗重掷。",
    "targetDice": true,
    "defenseOnly": true,
    "rerollMany": true,
    "ops": [
      [
        "rerollMany"
      ]
    ]
  },
  {
    "number": 18,
    "id": "six-it",
    "en": "Six-it!",
    "name": "变为六点",
    "cost": 1,
    "timing": "roll",
    "target": "ownDie",
    "copies": 1,
    "effects": [
      "将自己的 1 颗骰的点数改为 6。"
    ],
    "mechanics": {
      "operation": "setDice",
      "diceCount": 1,
      "scope": "own",
      "value": 6,
      "allowEnemy": false
    },
    "sources": [
      "https://tesera.ru/images/items/1823976/Santa%20PnP%202020.pdf",
      "https://dice-throne.rulepop.com/#faq",
      "https://lot.ahml.info/DiceThrone.pdf"
    ],
    "phase": "roll",
    "text": "将自己的 1 颗骰的点数改为 6。",
    "targetDice": true,
    "ops": [
      [
        "changeDie",
        6
      ]
    ]
  }
];
