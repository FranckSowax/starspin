flowchart TD
    A[Start] --> B[Detect Language]
    B --> C{Rating input 1 to 5}
    C -->|1 to 3| D[Show private feedback form]
    D --> E[Submit feedback to Merchant Dashboard]
    E --> F[Thank you message]
    C -->|4 to 5| G[Social engagement choices]
    G --> H[Prompt Google review]
    G --> I[Prompt follow social media]
    H --> J[Done button]
    I --> J[Done button]
    J --> K{Spin eligibility check}
    K -->|Allowed| L[Spin wheel game]
    K -->|Limit reached| M[Already spun message]
    L --> N[Display prize]
    N --> O[Generate digital coupon]
    O --> P[Show coupon code and countdown]
    P --> Q[End]