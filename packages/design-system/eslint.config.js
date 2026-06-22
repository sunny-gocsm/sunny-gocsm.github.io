import react from "eslint-plugin-react";
export default [
  { ignores: ["dist/**","node_modules/**","**/*.d.ts","**/*.card.html","**/*.prompt.md","**/*.md","**/*.css","**/*.json","**/*.html","**/*.svg"] },
  { files:["**/*.jsx"], plugins:{react}, languageOptions:{ecmaVersion:"latest",sourceType:"module",parserOptions:{ecmaFeatures:{jsx:true}}}, settings:{react:{version:"18"}}, rules:{
  "react/forbid-elements": [
    "error",
    {
      "forbid": []
    }
  ],
  "no-restricted-imports": [
    "error",
    {
      "patterns": [
        {
          "group": [
            "components/agentic/**",
            "components/core/**",
            "components/health/**",
            "components/insight/**",
            "components/onboarding/**",
            "components/shell/**",
            "ui_kits/client/**",
            "ui_kits/operator/**",
            "uploads/extracted/**"
          ],
          "message": "Import design-system components from 'index.js', not component internals."
        }
      ]
    }
  ],
  "no-restricted-syntax": [
    "error",
    {
      "selector": "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
      "message": "Raw hex color — use a design-system color token via var()."
    },
    {
      "selector": "Literal[value=/\\b\\d+px\\b/]",
      "message": "Raw px value — use a design-system spacing token via var()."
    },
    {
      "selector": "Literal[value=/font-family\\s*:\\s*(?!['\\\"]?(?:Inter|JetBrains Mono))/i]",
      "message": "Font not provided by the design system. Available: Inter, JetBrains Mono."
    },
    {
      "selector": "JSXOpeningElement[name.name='ActionReceipt'] > JSXAttribute > JSXIdentifier[name!=/^(?:state|title|scope|blastRadius|graceSeconds|reportBack|onUndo|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<ActionReceipt> doesn't accept that prop. Declared props: state, title, scope, blastRadius, graceSeconds, reportBack, onUndo."
    },
    {
      "selector": "JSXOpeningElement[name.name='ActionReceipt'] > JSXAttribute[name.name='state'] > Literal[value!=/^(?:pending|sent|stopped)$/]",
      "message": "<ActionReceipt> state must be one of 'pending' | 'sent' | 'stopped'."
    },
    {
      "selector": "JSXOpeningElement[name.name='Badge'] > JSXAttribute > JSXIdentifier[name!=/^(?:variant|dot|children|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<Badge> doesn't accept that prop. Declared props: variant, dot, children."
    },
    {
      "selector": "JSXOpeningElement[name.name='Badge'] > JSXAttribute[name.name='variant'] > Literal[value!=/^(?:neutral|blue|pos|warn|danger|ai)$/]",
      "message": "<Badge> variant must be one of 'neutral' | 'blue' | 'pos' | 'warn' | 'danger' | 'ai'."
    },
    {
      "selector": "JSXOpeningElement[name.name='Button'] > JSXAttribute > JSXIdentifier[name!=/^(?:variant|size|icon|iconRight|disabled|children|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<Button> doesn't accept that prop. Declared props: variant, size, icon, iconRight, disabled, children."
    },
    {
      "selector": "JSXOpeningElement[name.name='Button'] > JSXAttribute[name.name='variant'] > Literal[value!=/^(?:primary|secondary|ghost|danger|ai)$/]",
      "message": "<Button> variant must be one of 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai'."
    },
    {
      "selector": "JSXOpeningElement[name.name='Button'] > JSXAttribute[name.name='size'] > Literal[value!=/^(?:sm|md|lg)$/]",
      "message": "<Button> size must be one of 'sm' | 'md' | 'lg'."
    },
    {
      "selector": "JSXOpeningElement[name.name='Card'] > JSXAttribute > JSXIdentifier[name!=/^(?:hover|padded|children|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<Card> doesn't accept that prop. Declared props: hover, padded, children."
    },
    {
      "selector": "JSXOpeningElement[name.name='Checkbox'] > JSXAttribute > JSXIdentifier[name!=/^(?:label|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<Checkbox> doesn't accept that prop. Declared props: label."
    },
    {
      "selector": "JSXOpeningElement[name.name='ConfTag'] > JSXAttribute > JSXIdentifier[name!=/^(?:basis|detail|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<ConfTag> doesn't accept that prop. Declared props: basis, detail."
    },
    {
      "selector": "JSXOpeningElement[name.name='ConfTag'] > JSXAttribute[name.name='basis'] > Literal[value!=/^(?:fact|projection|guess)$/]",
      "message": "<ConfTag> basis must be one of 'fact' | 'projection' | 'guess'."
    },
    {
      "selector": "JSXOpeningElement[name.name='Delta'] > JSXAttribute > JSXIdentifier[name!=/^(?:value|direction|context|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<Delta> doesn't accept that prop. Declared props: value, direction, context."
    },
    {
      "selector": "JSXOpeningElement[name.name='Delta'] > JSXAttribute[name.name='direction'] > Literal[value!=/^(?:up|down|flat|bad-up|good-down)$/]",
      "message": "<Delta> direction must be one of 'up' | 'down' | 'flat' | 'bad-up' | 'good-down'."
    },
    {
      "selector": "JSXOpeningElement[name.name='HealthBadge'] > JSXAttribute > JSXIdentifier[name!=/^(?:band|label|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<HealthBadge> doesn't accept that prop. Declared props: band, label."
    },
    {
      "selector": "JSXOpeningElement[name.name='HealthBadge'] > JSXAttribute[name.name='band'] > Literal[value!=/^(?:thriving|healthy|watch|atrisk)$/]",
      "message": "<HealthBadge> band must be one of 'thriving' | 'healthy' | 'watch' | 'atrisk'."
    },
    {
      "selector": "JSXOpeningElement[name.name='HealthTile'] > JSXAttribute > JSXIdentifier[name!=/^(?:band|count|pct|label|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<HealthTile> doesn't accept that prop. Declared props: band, count, pct, label."
    },
    {
      "selector": "JSXOpeningElement[name.name='HealthTile'] > JSXAttribute[name.name='band'] > Literal[value!=/^(?:thriving|healthy|watch|atrisk)$/]",
      "message": "<HealthTile> band must be one of 'thriving' | 'healthy' | 'watch' | 'atrisk'."
    },
    {
      "selector": "JSXOpeningElement[name.name='Field'] > JSXAttribute > JSXIdentifier[name!=/^(?:label|hint|htmlFor|className|children|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<Field> doesn't accept that prop. Declared props: label, hint, htmlFor, className, children."
    },
    {
      "selector": "JSXOpeningElement[name.name='LiveStatus'] > JSXAttribute > JSXIdentifier[name!=/^(?:state|label|watchingCount|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<LiveStatus> doesn't accept that prop. Declared props: state, label, watchingCount."
    },
    {
      "selector": "JSXOpeningElement[name.name='LiveStatus'] > JSXAttribute[name.name='state'] > Literal[value!=/^(?:fresh|recent|stale|error)$/]",
      "message": "<LiveStatus> state must be one of 'fresh' | 'recent' | 'stale' | 'error'."
    },
    {
      "selector": "JSXOpeningElement[name.name='MetricCard'] > JSXAttribute > JSXIdentifier[name!=/^(?:label|value|icon|iconTone|accent|delta|context|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<MetricCard> doesn't accept that prop. Declared props: label, value, icon, iconTone, accent, delta, context."
    },
    {
      "selector": "JSXOpeningElement[name.name='MetricCard'] > JSXAttribute[name.name='iconTone'] > Literal[value!=/^(?:info|pos|warn|neg)$/]",
      "message": "<MetricCard> iconTone must be one of 'info' | 'pos' | 'warn' | 'neg'."
    },
    {
      "selector": "JSXOpeningElement[name.name='MetricCard'] > JSXAttribute[name.name='accent'] > Literal[value!=/^(?:pos|neg)$/]",
      "message": "<MetricCard> accent must be one of 'pos' | 'neg'."
    },
    {
      "selector": "JSXOpeningElement[name.name='OnboardingStep'] > JSXAttribute > JSXIdentifier[name!=/^(?:state|title|sub|affix|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<OnboardingStep> doesn't accept that prop. Declared props: state, title, sub, affix."
    },
    {
      "selector": "JSXOpeningElement[name.name='OnboardingStep'] > JSXAttribute[name.name='state'] > Literal[value!=/^(?:not_started|locked|in_progress|verifying|waiting_on_agency|needs_attention|done|skipped|stalled)$/]",
      "message": "<OnboardingStep> state must be one of 'not_started' | 'locked' | 'in_progress' | 'verifying' | 'waiting_on_agency' | 'needs_attention' | 'done' | 'skipped' | 'stalled'."
    },
    {
      "selector": "JSXOpeningElement[name.name='PillarWeights'] > JSXAttribute > JSXIdentifier[name!=/^(?:pas|revenue|login|feedback|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<PillarWeights> doesn't accept that prop. Declared props: pas, revenue, login, feedback."
    },
    {
      "selector": "JSXOpeningElement[name.name='QueueRow'] > JSXAttribute > JSXIdentifier[name!=/^(?:subject|impact|blockedBy|sla|slaBreach|memory|action|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<QueueRow> doesn't accept that prop. Declared props: subject, impact, blockedBy, sla, slaBreach, memory, action."
    },
    {
      "selector": "JSXOpeningElement[name.name='QueueRow'] > JSXAttribute[name.name='blockedBy'] > Literal[value!=/^(?:client|agency)$/]",
      "message": "<QueueRow> blockedBy must be one of 'client' | 'agency'."
    },
    {
      "selector": "JSXOpeningElement[name.name='RailItem'] > JSXAttribute > JSXIdentifier[name!=/^(?:id|label|icon|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<RailItem> doesn't accept that prop. Declared props: id, label, icon."
    },
    {
      "selector": "JSXOpeningElement[name.name='ScoreRing'] > JSXAttribute > JSXIdentifier[name!=/^(?:score|band|size|label|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<ScoreRing> doesn't accept that prop. Declared props: score, band, size, label."
    },
    {
      "selector": "JSXOpeningElement[name.name='ScoreRing'] > JSXAttribute[name.name='band'] > Literal[value!=/^(?:thriving|healthy|watch|atrisk)$/]",
      "message": "<ScoreRing> band must be one of 'thriving' | 'healthy' | 'watch' | 'atrisk'."
    },
    {
      "selector": "JSXOpeningElement[name.name='TabItem'] > JSXAttribute > JSXIdentifier[name!=/^(?:id|label|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<TabItem> doesn't accept that prop. Declared props: id, label."
    },
    {
      "selector": "JSXOpeningElement[name.name='Toggle'] > JSXAttribute > JSXIdentifier[name!=/^(?:on|locked|onChange|label|className|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<Toggle> doesn't accept that prop. Declared props: on, locked, onChange, label, className."
    },
    {
      "selector": "JSXOpeningElement[name.name='Verdict'] > JSXAttribute > JSXIdentifier[name!=/^(?:tone|attribution|children|score|band|stamp|actions|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<Verdict> doesn't accept that prop. Declared props: tone, attribution, children, score, band, stamp, actions."
    },
    {
      "selector": "JSXOpeningElement[name.name='Verdict'] > JSXAttribute[name.name='tone'] > Literal[value!=/^(?:pos|watch|risk)$/]",
      "message": "<Verdict> tone must be one of 'pos' | 'watch' | 'risk'."
    },
    {
      "selector": "JSXOpeningElement[name.name='Verdict'] > JSXAttribute[name.name='band'] > Literal[value!=/^(?:thriving|healthy|watch|atrisk)$/]",
      "message": "<Verdict> band must be one of 'thriving' | 'healthy' | 'watch' | 'atrisk'."
    },
    {
      "selector": "JSXOpeningElement[name.name='Driver'] > JSXAttribute > JSXIdentifier[name!=/^(?:title|desc|severity|action|key|ref|className|style|children|onClick|onChange|onInput|onSubmit|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseDown|onMouseUp|onScroll|id|role|type|name|value|defaultValue|defaultChecked|checked|placeholder|href|target|rel|title|tabIndex|htmlFor|autoFocus|aria-[a-zA-Z-]+|data-[a-zA-Z-]+)$/]",
      "message": "<Driver> doesn't accept that prop. Declared props: title, desc, severity, action."
    },
    {
      "selector": "JSXOpeningElement[name.name='Driver'] > JSXAttribute[name.name='severity'] > Literal[value!=/^(?:high|med|pos)$/]",
      "message": "<Driver> severity must be one of 'high' | 'med' | 'pos'."
    }
  ]
} },
  { files:["**/index.js"], rules:{"no-restricted-imports":"off"} }
];
