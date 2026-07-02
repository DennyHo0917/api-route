const SUPPORT_EMAIL = 'support@api-route.com';

export const LEGAL_COPY = {
  en: {
    labels: {
      backHome: 'Back to home',
      lastUpdated: 'Last updated',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
    },
    privacy: {
      title: 'Privacy Policy',
      updated: 'July 2, 2026',
      description: 'How API-Route collects, uses, protects, and shares information for its AI API gateway, billing, and support services.',
      intro: 'This Privacy Policy explains how API-Route collects, uses, and protects information when you use our AI API gateway, account dashboard, billing, and support services.',
      sections: [
        {
          title: 'Information we collect',
          body: [
            'Account information such as your email address, login identifier, and account settings.',
            'Service usage information such as API keys created in your account, model usage, request logs needed for billing and troubleshooting, quota balances, and package history.',
            'Payment and billing information handled by our payment providers. We do not store full card numbers.',
            'Support information you send to us by email, Telegram, or other support channels.',
          ],
        },
        {
          title: 'How we use information',
          body: [
            'To provide API access, route requests, maintain account balances, process top-ups and subscriptions, and prevent abuse.',
            'To troubleshoot service issues, respond to support requests, improve reliability, and protect users and upstream providers.',
            'To comply with payment, fraud prevention, tax, accounting, legal, and security obligations.',
          ],
        },
        {
          title: 'Sharing and processors',
          body: [
            'We share information only as needed with infrastructure providers, payment processors, fraud-prevention tools, analytics or monitoring services, and upstream API providers involved in delivering the service.',
            'We may disclose information when required by law or to protect API-Route, our users, payment partners, or upstream providers from fraud, abuse, or security threats.',
          ],
        },
        {
          title: 'Data retention and security',
          body: [
            'We keep account, billing, support, and usage records for as long as needed to provide the service, resolve disputes, meet legal obligations, and prevent abuse.',
            'We use reasonable technical and organizational safeguards, but no online service can guarantee absolute security.',
          ],
        },
        {
          title: 'Your choices',
          body: [
            'You may contact us to request access, correction, or deletion of your personal information, subject to legal, billing, fraud-prevention, and security retention requirements.',
            `For privacy requests, contact ${SUPPORT_EMAIL}.`,
          ],
        },
      ],
    },
    terms: {
      title: 'Terms of Service',
      updated: 'July 2, 2026',
      description: 'The terms for using API-Route, including API access, accounts, payments, credits, acceptable use, and support.',
      intro: 'These Terms of Service govern your use of API-Route, including our AI API gateway, dashboard, API keys, billing, packages, top-ups, and related support services.',
      sections: [
        {
          title: 'Service description',
          body: [
            'API-Route provides access to multiple AI models through a unified API gateway, including account management, API keys, routing, billing, usage records, and package or credit management.',
            'The service depends on third-party infrastructure and upstream AI model providers. Availability, model behavior, rate limits, and features may change.',
          ],
        },
        {
          title: 'Accounts and API keys',
          body: [
            'You are responsible for keeping your account credentials and API keys secure.',
            'You must not resell, share, or expose API keys in a way that enables abuse, fraud, spam, illegal activity, or unauthorized access.',
            'We may suspend or restrict accounts, API keys, or requests that create security, payment, legal, or upstream-provider risk.',
          ],
        },
        {
          title: 'Payments, credits, and refunds',
          body: [
            'Prices, packages, credit amounts, durations, and renewal terms are shown before checkout or purchase.',
            'Digital API credits and activated packages are generally non-refundable once delivered or used, except where required by law or where we confirm a duplicate charge, failed activation, or billing error.',
            `If a payment, credit, or package does not activate correctly, contact ${SUPPORT_EMAIL} before opening a dispute or chargeback so we can investigate.`,
          ],
        },
        {
          title: 'Acceptable use',
          body: [
            'You must not use the service for illegal content, malware, credential theft, spam, harassment, fraud, payment abuse, attempts to bypass model safety systems, or activity that violates upstream provider policies.',
            'You are responsible for prompts, inputs, outputs, integrations, and downstream use of API responses generated through your account.',
          ],
        },
        {
          title: 'Disclaimers and liability',
          body: [
            'The service is provided on an as-is and as-available basis. We do not guarantee uninterrupted access, error-free outputs, or that AI responses will be accurate, safe, or suitable for every use case.',
            'To the maximum extent permitted by law, API-Route is not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, lost data, or business interruption.',
          ],
        },
        {
          title: 'Contact',
          body: [`For support, billing, legal, or policy questions, contact ${SUPPORT_EMAIL}.`],
        },
      ],
    },
  },
  zh: {
    labels: {
      backHome: '返回首页',
      lastUpdated: '最后更新',
      privacy: '隐私政策',
      terms: '服务条款',
    },
    privacy: {
      title: '隐私政策',
      updated: '2026年7月2日',
      description: 'API-Route 如何为 AI API 网关、账单和客服服务收集、使用、保护和共享信息。',
      intro: '本隐私政策说明您使用 API-Route 的 AI API 网关、账户后台、账单和客服服务时，我们如何收集、使用和保护信息。',
      sections: [
        {
          title: '我们收集的信息',
          body: [
            '账户信息，例如您的邮箱地址、登录标识和账户设置。',
            '服务使用信息，例如您账户中创建的 API Key、模型用量、用于计费和排障的请求记录、额度余额和套餐历史。',
            '由支付服务商处理的付款和账单信息。我们不会存储完整银行卡号。',
            '您通过邮件、Telegram 或其他客服渠道发送给我们的支持信息。',
          ],
        },
        {
          title: '我们如何使用信息',
          body: [
            '用于提供 API 访问、请求路由、账户余额维护、充值和订阅处理，以及防止滥用。',
            '用于排查服务问题、回复客服请求、提升可靠性，并保护用户和上游服务商。',
            '用于满足支付、反欺诈、税务、会计、法律和安全要求。',
          ],
        },
        {
          title: '共享和处理方',
          body: [
            '我们只会在提供服务所需范围内，与基础设施服务商、支付处理方、反欺诈工具、分析或监控服务，以及参与服务交付的上游 API 服务商共享信息。',
            '在法律要求或为了保护 API-Route、用户、支付合作方或上游服务商免受欺诈、滥用或安全威胁时，我们可能披露信息。',
          ],
        },
        {
          title: '数据保留和安全',
          body: [
            '我们会在提供服务、解决争议、满足法律义务和防止滥用所需期间，保留账户、账单、客服和使用记录。',
            '我们采用合理的技术和组织措施保护信息，但任何在线服务都无法保证绝对安全。',
          ],
        },
        {
          title: '您的选择',
          body: [
            '您可以联系我们，请求访问、更正或删除您的个人信息，但该请求可能受法律、账单、反欺诈和安全保留要求限制。',
            `隐私相关请求请联系 ${SUPPORT_EMAIL}。`,
          ],
        },
      ],
    },
    terms: {
      title: '服务条款',
      updated: '2026年7月2日',
      description: '使用 API-Route 的条款，包括 API 访问、账户、付款、额度、可接受使用和客服支持。',
      intro: '本服务条款适用于您使用 API-Route，包括我们的 AI API 网关、控制台、API Key、账单、套餐、充值和相关客服服务。',
      sections: [
        {
          title: '服务说明',
          body: [
            'API-Route 通过统一 API 网关提供多种 AI 模型访问能力，包括账户管理、API Key、请求路由、账单、使用记录和套餐或额度管理。',
            '本服务依赖第三方基础设施和上游 AI 模型服务商。可用性、模型行为、速率限制和功能可能发生变化。',
          ],
        },
        {
          title: '账户和 API Key',
          body: [
            '您需要自行保护账户凭证和 API Key 的安全。',
            '您不得以导致滥用、欺诈、垃圾信息、违法活动或未经授权访问的方式转售、共享或暴露 API Key。',
            '如账户、API Key 或请求带来安全、支付、法律或上游服务商风险，我们可能暂停或限制相关使用。',
          ],
        },
        {
          title: '付款、额度和退款',
          body: [
            '价格、套餐、额度数量、有效期和续费条款会在结账或购买前展示。',
            '数字 API 额度和已激活套餐一经交付或使用，通常不支持退款，法律要求或我们确认存在重复扣款、激活失败、账单错误的情况除外。',
            `如果付款、额度或套餐未正确激活，请先联系 ${SUPPORT_EMAIL}，我们会协助排查，再考虑争议或拒付。`,
          ],
        },
        {
          title: '可接受使用',
          body: [
            '您不得将本服务用于违法内容、恶意软件、凭证窃取、垃圾信息、骚扰、欺诈、支付滥用、规避模型安全机制，或违反上游服务商政策的活动。',
            '您需要对账户下的提示词、输入、输出、集成方式以及 API 响应的下游使用负责。',
          ],
        },
        {
          title: '免责声明和责任限制',
          body: [
            '本服务按现状和可用状态提供。我们不保证服务不中断、输出无错误，或 AI 响应在任何场景下都准确、安全或适用。',
            '在法律允许的最大范围内，API-Route 不对间接、附带、特殊、后果性或惩罚性损害，以及利润损失、数据丢失或业务中断承担责任。',
          ],
        },
        {
          title: '联系方式',
          body: [`如需客服、账单、法律或政策支持，请联系 ${SUPPORT_EMAIL}。`],
        },
      ],
    },
  },
  ja: {
    labels: {
      backHome: 'ホームへ戻る',
      lastUpdated: '最終更新日',
      privacy: 'プライバシーポリシー',
      terms: '利用規約',
    },
    privacy: {
      title: 'プライバシーポリシー',
      updated: '2026年7月2日',
      description: 'API-Route が AI API ゲートウェイ、請求、サポートサービスで情報を収集、利用、保護、共有する方法。',
      intro: '本プライバシーポリシーは、API-Route の AI API ゲートウェイ、アカウント管理、請求、サポートサービスの利用時に、当社が情報をどのように収集、利用、保護するかを説明します。',
      sections: [
        {
          title: '収集する情報',
          body: [
            'メールアドレス、ログイン識別子、アカウント設定などのアカウント情報。',
            'アカウントで作成された API キー、モデル利用量、請求や障害対応に必要なリクエストログ、残高、プラン履歴などのサービス利用情報。',
            '決済事業者が処理する支払いおよび請求情報。当社は完全なカード番号を保存しません。',
            'メール、Telegram、その他のサポート窓口を通じて送信されたお問い合わせ情報。',
          ],
        },
        {
          title: '情報の利用目的',
          body: [
            'API アクセス、リクエストルーティング、残高管理、チャージやサブスクリプション処理、不正利用防止のため。',
            'サービス問題の調査、サポート対応、信頼性向上、ユーザーおよび上流プロバイダーの保護のため。',
            '決済、不正防止、税務、会計、法務、セキュリティ上の義務を満たすため。',
          ],
        },
        {
          title: '共有先と処理委託',
          body: [
            'サービス提供に必要な範囲で、インフラ事業者、決済処理業者、不正防止ツール、分析または監視サービス、上流 API プロバイダーと情報を共有します。',
            '法令で求められる場合、または API-Route、ユーザー、決済パートナー、上流プロバイダーを不正、悪用、セキュリティ脅威から守るために情報を開示することがあります。',
          ],
        },
        {
          title: 'データ保持とセキュリティ',
          body: [
            'サービス提供、紛争解決、法的義務の履行、不正利用防止に必要な期間、アカウント、請求、サポート、利用記録を保持します。',
            '合理的な技術的および組織的安全対策を講じますが、オンラインサービスに絶対的な安全性はありません。',
          ],
        },
        {
          title: 'お客様の選択',
          body: [
            '法令、請求、不正防止、セキュリティ上の保持要件に従い、個人情報へのアクセス、訂正、削除をリクエストできます。',
            `プライバシーに関するお問い合わせは ${SUPPORT_EMAIL} までご連絡ください。`,
          ],
        },
      ],
    },
    terms: {
      title: '利用規約',
      updated: '2026年7月2日',
      description: 'API-Route の API アクセス、アカウント、支払い、クレジット、許容される利用、サポートに関する利用条件。',
      intro: '本利用規約は、API-Route の AI API ゲートウェイ、ダッシュボード、API キー、請求、プラン、チャージ、および関連サポートサービスの利用に適用されます。',
      sections: [
        {
          title: 'サービス内容',
          body: [
            'API-Route は、統一 API ゲートウェイを通じて複数の AI モデルへのアクセスを提供し、アカウント管理、API キー、ルーティング、請求、利用記録、プランまたはクレジット管理を含みます。',
            '本サービスは第三者インフラおよび上流 AI モデルプロバイダーに依存します。可用性、モデルの挙動、レート制限、機能は変更される場合があります。',
          ],
        },
        {
          title: 'アカウントと API キー',
          body: [
            'アカウント認証情報および API キーの安全管理はお客様の責任です。',
            '不正利用、詐欺、スパム、違法行為、無権限アクセスにつながる形で API キーを転売、共有、公開してはなりません。',
            'セキュリティ、決済、法務、上流プロバイダー上のリスクがある場合、アカウント、API キー、リクエストを停止または制限することがあります。',
          ],
        },
        {
          title: '支払い、クレジット、返金',
          body: [
            '価格、プラン、クレジット量、有効期間、更新条件は購入または決済前に表示されます。',
            'デジタル API クレジットおよび有効化済みプランは、法令で必要な場合、重複請求、有効化失敗、請求エラーが確認された場合を除き、原則として返金されません。',
            `支払い、クレジット、プランが正しく有効化されない場合は、異議申し立てやチャージバックの前に ${SUPPORT_EMAIL} までご連絡ください。`,
          ],
        },
        {
          title: '許容される利用',
          body: [
            '違法コンテンツ、マルウェア、認証情報窃取、スパム、嫌がらせ、詐欺、決済悪用、モデル安全機構の回避、上流プロバイダーのポリシー違反に本サービスを利用してはなりません。',
            'お客様は、アカウントを通じたプロンプト、入力、出力、連携、および API 応答の下流利用について責任を負います。',
          ],
        },
        {
          title: '免責および責任制限',
          body: [
            '本サービスは現状有姿かつ提供可能な範囲で提供されます。中断のないアクセス、エラーのない出力、AI 応答の正確性、安全性、特定用途への適合性を保証しません。',
            '法律で認められる最大範囲において、API-Route は間接損害、付随的損害、特別損害、結果損害、懲罰的損害、利益喪失、データ損失、事業中断について責任を負いません。',
          ],
        },
        {
          title: 'お問い合わせ',
          body: [`サポート、請求、法務、ポリシーに関するお問い合わせは ${SUPPORT_EMAIL} までご連絡ください。`],
        },
      ],
    },
  },
  ko: {
    labels: {
      backHome: '홈으로 돌아가기',
      lastUpdated: '마지막 업데이트',
      privacy: '개인정보 처리방침',
      terms: '서비스 약관',
    },
    privacy: {
      title: '개인정보 처리방침',
      updated: '2026년 7월 2일',
      description: 'API-Route가 AI API 게이트웨이, 결제 및 지원 서비스에서 정보를 수집, 이용, 보호, 공유하는 방식입니다.',
      intro: '본 개인정보 처리방침은 API-Route의 AI API 게이트웨이, 계정 대시보드, 결제 및 지원 서비스를 사용할 때 당사가 정보를 수집, 이용, 보호하는 방식을 설명합니다.',
      sections: [
        {
          title: '수집하는 정보',
          body: [
            '이메일 주소, 로그인 식별자, 계정 설정 등 계정 정보.',
            '계정에서 생성한 API 키, 모델 사용량, 과금 및 문제 해결에 필요한 요청 로그, 잔액, 패키지 이력 등 서비스 사용 정보.',
            '결제 제공업체가 처리하는 결제 및 청구 정보. 당사는 전체 카드 번호를 저장하지 않습니다.',
            '이메일, Telegram 또는 기타 지원 채널을 통해 보내는 문의 정보.',
          ],
        },
        {
          title: '정보 이용 목적',
          body: [
            'API 접근 제공, 요청 라우팅, 계정 잔액 관리, 충전 및 구독 처리, 남용 방지.',
            '서비스 문제 해결, 지원 요청 응답, 안정성 개선, 사용자 및 상위 제공업체 보호.',
            '결제, 사기 방지, 세무, 회계, 법률 및 보안 의무 준수.',
          ],
        },
        {
          title: '공유 및 처리업체',
          body: [
            '서비스 제공에 필요한 범위에서 인프라 제공업체, 결제 처리업체, 사기 방지 도구, 분석 또는 모니터링 서비스, 상위 API 제공업체와 정보를 공유합니다.',
            '법률상 요구되거나 API-Route, 사용자, 결제 파트너 또는 상위 제공업체를 사기, 남용, 보안 위협으로부터 보호하기 위해 정보를 공개할 수 있습니다.',
          ],
        },
        {
          title: '데이터 보관 및 보안',
          body: [
            '서비스 제공, 분쟁 해결, 법적 의무 이행, 남용 방지를 위해 필요한 기간 동안 계정, 결제, 지원 및 사용 기록을 보관합니다.',
            '합리적인 기술적 및 조직적 보호 조치를 사용하지만, 어떤 온라인 서비스도 절대적인 보안을 보장할 수 없습니다.',
          ],
        },
        {
          title: '이용자의 선택',
          body: [
            '법률, 결제, 사기 방지 및 보안 보관 요건에 따라 개인정보 열람, 정정 또는 삭제를 요청할 수 있습니다.',
            `개인정보 관련 요청은 ${SUPPORT_EMAIL} 으로 문의하세요.`,
          ],
        },
      ],
    },
    terms: {
      title: '서비스 약관',
      updated: '2026년 7월 2일',
      description: 'API-Route의 API 접근, 계정, 결제, 크레딧, 허용되는 이용 및 지원에 관한 약관입니다.',
      intro: '본 서비스 약관은 API-Route의 AI API 게이트웨이, 대시보드, API 키, 결제, 패키지, 충전 및 관련 지원 서비스 이용에 적용됩니다.',
      sections: [
        {
          title: '서비스 설명',
          body: [
            'API-Route는 통합 API 게이트웨이를 통해 여러 AI 모델에 접근할 수 있도록 하며, 계정 관리, API 키, 라우팅, 결제, 사용 기록, 패키지 또는 크레딧 관리를 포함합니다.',
            '본 서비스는 제3자 인프라 및 상위 AI 모델 제공업체에 의존합니다. 가용성, 모델 동작, 속도 제한 및 기능은 변경될 수 있습니다.',
          ],
        },
        {
          title: '계정 및 API 키',
          body: [
            '계정 자격 증명과 API 키를 안전하게 관리할 책임은 이용자에게 있습니다.',
            '남용, 사기, 스팸, 불법 활동 또는 무단 접근을 가능하게 하는 방식으로 API 키를 재판매, 공유 또는 노출해서는 안 됩니다.',
            '보안, 결제, 법률 또는 상위 제공업체 리스크가 있는 경우 계정, API 키 또는 요청을 일시 중지하거나 제한할 수 있습니다.',
          ],
        },
        {
          title: '결제, 크레딧 및 환불',
          body: [
            '가격, 패키지, 크레딧 수량, 기간 및 갱신 조건은 결제 또는 구매 전에 표시됩니다.',
            '디지털 API 크레딧과 활성화된 패키지는 법률상 필요한 경우 또는 중복 청구, 활성화 실패, 결제 오류가 확인된 경우를 제외하고 일반적으로 환불되지 않습니다.',
            `결제, 크레딧 또는 패키지가 정상적으로 활성화되지 않으면 분쟁 또는 차지백을 제기하기 전에 ${SUPPORT_EMAIL} 으로 문의해 주세요.`,
          ],
        },
        {
          title: '허용되는 이용',
          body: [
            '불법 콘텐츠, 악성코드, 자격 증명 탈취, 스팸, 괴롭힘, 사기, 결제 남용, 모델 안전 시스템 우회 또는 상위 제공업체 정책 위반에 서비스를 사용해서는 안 됩니다.',
            '계정에서 발생하는 프롬프트, 입력, 출력, 통합 및 API 응답의 후속 사용에 대한 책임은 이용자에게 있습니다.',
          ],
        },
        {
          title: '면책 및 책임 제한',
          body: [
            '서비스는 있는 그대로 및 이용 가능한 상태로 제공됩니다. 중단 없는 접근, 오류 없는 출력, AI 응답의 정확성, 안전성 또는 특정 목적 적합성을 보장하지 않습니다.',
            '법률이 허용하는 최대 범위에서 API-Route는 간접, 부수, 특별, 결과적 또는 징벌적 손해, 이익 손실, 데이터 손실 또는 사업 중단에 대해 책임지지 않습니다.',
          ],
        },
        {
          title: '문의',
          body: [`지원, 결제, 법률 또는 정책 문의는 ${SUPPORT_EMAIL} 으로 연락해 주세요.`],
        },
      ],
    },
  },
};

export const getLegalCopy = (language, type) => {
  const bundle = LEGAL_COPY[language] || LEGAL_COPY.en;
  return {
    labels: bundle.labels,
    page: bundle[type] || bundle.privacy,
  };
};
