import { faker } from '@faker-js/faker/locale/ja';

export function createPropertyData(overrides: Record<string, unknown> = {}) {
  return {
    name: `${faker.location.city()}ビル`,
    support_phone: `0${faker.string.numeric(9)}`,
    support_form_url: faker.datatype.boolean() ? faker.internet.url() : null,
    ...overrides,
  };
}

export function createFaqCategoryData(overrides: Record<string, unknown> = {}) {
  const categories = ['設備', 'ゴミ出し', '駐車場', '騒音・マナー', '共用部', '契約・手続き'];
  return {
    name: faker.helpers.arrayElement(categories) + '_' + faker.string.alphanumeric(4),
    icon: faker.helpers.arrayElement(['🔧', '🗑️', '🚗', '🔔', '🏢', '📄', null]),
    ...overrides,
  };
}

export function createFaqTagData(overrides: Record<string, unknown> = {}) {
  const tags = ['緊急', '夜間対応', '工事', '清掃', '設備故障', '更新', '解約'];
  return {
    name: faker.helpers.arrayElement(tags) + '_' + faker.string.alphanumeric(4),
    ...overrides,
  };
}

export function createFaqData(
  propertyId: string,
  categoryId: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    property_id: propertyId,
    category_id: categoryId,
    title: faker.lorem.sentence({ min: 5, max: 15 }).replace(/\.$/, '？'),
    body: faker.lorem.paragraphs(2),
    access_count: faker.number.int({ min: 0, max: 500 }),
    is_published: faker.datatype.boolean({ probability: 0.8 }),
    ...overrides,
  };
}

export function createFeedbackData(faqId: string, overrides: Record<string, unknown> = {}) {
  return {
    faq_id: faqId,
    value: faker.helpers.arrayElement(['solved', 'unsolved'] as const),
    ...overrides,
  };
}

export function createChatSessionData(propertyId: string, overrides: Record<string, unknown> = {}) {
  return {
    property_id: propertyId,
    ...overrides,
  };
}

export function createChatMessageData(
  sessionId: string,
  messageType: 'user' | 'ai',
  overrides: Record<string, unknown> = {}
) {
  return {
    session_id: sessionId,
    message_type: messageType,
    body: faker.lorem.sentence({ min: 8, max: 30 }),
    is_unresolved: messageType === 'ai' ? faker.datatype.boolean({ probability: 0.2 }) : null,
    ...overrides,
  };
}

export function createQuestionSuggestionData(
  displayOrder: number,
  overrides: Record<string, unknown> = {}
) {
  const suggestions = [
    'エアコンが故障したときはどうすればよいですか？',
    'ゴミの分別方法を教えてください',
    '駐車場の手続きについて知りたいです',
    '騒音トラブルの相談窓口はどこですか？',
    '共用部の清掃スケジュールを教えてください',
  ];
  return {
    text: suggestions[displayOrder - 1] ?? faker.lorem.sentence(),
    display_order: displayOrder,
    ...overrides,
  };
}

// バッチ生成ヘルパー
export function createProperties(count: number, overrides: Record<string, unknown> = {}) {
  return Array.from({ length: count }, () => createPropertyData(overrides));
}

export function createFaqCategories(count: number) {
  const names = ['設備', 'ゴミ出し', '駐車場', '騒音・マナー', '共用部', '契約・手続き'];
  return names.slice(0, count).map((name, i) => ({
    name,
    icon: ['🔧', '🗑️', '🚗', '🔔', '🏢', '📄'][i] ?? null,
  }));
}

export function createFaqTags(count: number) {
  const names = ['緊急', '夜間対応', '工事', '清掃', '設備故障', '更新', '解約'];
  return names.slice(0, count).map((name) => ({ name }));
}

// ────────────────────────────────────────────────
// リアルな固定FAQテンプレート（シード専用）
// ────────────────────────────────────────────────
export const REAL_FAQ_TEMPLATES: Array<{
  categoryName: string;
  title: string;
  body: string;
  access_count: number;
  tagNames: string[];
}> = [
  // 設備
  {
    categoryName: '設備',
    title: 'エアコンから水が漏れている',
    body: `排水ドレンホースの詰まりや、フィルターの汚れが原因で発生することが多いです。

【応急処置】
1. エアコンの電源をすぐに切る
2. 室内機の下にタオルを敷いて床への浸水を防ぐ
3. サポートデスクへご連絡ください

業者による点検・修理が必要な場合、管理会社が手配します。入居者様が独自に修理業者を呼んだ場合、費用が自己負担になる場合がありますのでご注意ください。`,
    access_count: 320,
    tagNames: ['設備故障', '緊急'],
  },
  {
    categoryName: '設備',
    title: '給湯器のお湯が出ない',
    body: `以下の項目をご確認ください。

1. ガスの元栓が開いているか確認する
2. 給湯器リモコンにエラーコードが表示されていないか確認する
3. ガスメーターの安全装置（遮断）が作動していないか確認する

エラーコードが表示されている場合は、その番号をお控えの上サポートデスクまでご連絡ください。ガス漏れの臭いがする場合は、すぐにガス会社の緊急窓口へご連絡ください。`,
    access_count: 280,
    tagNames: ['設備故障', '緊急'],
  },
  {
    categoryName: '設備',
    title: '水道の蛇口から水漏れしている',
    body: `水漏れを発見した場合は、まず止水栓を閉めて水の流れを止めてください。

【止水栓の場所】
- 洗面台：洗面台下の収納内
- キッチン：シンク下の収納内
- トイレ：便器横の壁面または床面

止水栓を閉めた後、サポートデスクへご連絡ください。管理会社が修理業者を手配します。入居者様の故意・過失による破損は修繕費用をご負担いただく場合があります。`,
    access_count: 195,
    tagNames: ['設備故障', '緊急'],
  },
  // ゴミ出し
  {
    categoryName: 'ゴミ出し',
    title: 'ゴミの分別・収集曜日について知りたい',
    body: `当物件のゴミ収集スケジュールは以下のとおりです。

- 燃えるごみ：月曜・木曜
- 燃えないごみ：第2・第4水曜
- 資源ごみ（缶・瓶・ペットボトル）：火曜
- 古紙・段ボール：第1・第3金曜

ゴミは当日朝8時までに1階ゴミ置き場へお出しください。前日夜の搬出は禁止です。分別されていないごみは収集されませんのでご注意ください。`,
    access_count: 410,
    tagNames: ['清掃'],
  },
  {
    categoryName: 'ゴミ出し',
    title: '粗大ごみの処分方法を教えてください',
    body: `家具・家電などの大型ごみは市区町村の粗大ごみ収集をご利用ください。

【申し込み方法】
1. 市のコールセンターへ電話またはインターネットで申し込む
2. 収集日・費用の確認後、指定日の朝8時までに所定の場所へ出す

マンション共用部・ゴミ置き場への粗大ごみの放置は禁止です。違反した場合は費用を請求させていただく場合があります。テレビ・冷蔵庫・洗濯機・エアコンは家電リサイクル料が別途必要です。`,
    access_count: 175,
    tagNames: ['清掃'],
  },
  // 駐車場
  {
    categoryName: '駐車場',
    title: '駐車場を新たに借りたい・解約したい',
    body: `【新規契約を希望する場合】
サポートデスクまでご連絡のうえ、現在の空き状況をご確認ください。空きがある場合は申込書類をご提出いただき、翌月から利用開始となります。

【解約する場合】
解約希望月の前月末日までにサポートデスクへ書面またはメールでお申し出ください。月額賃料は居室の家賃とは別途請求となります。車種・サイズによってはご利用いただけない区画がある場合があります。`,
    access_count: 145,
    tagNames: ['更新', '解約'],
  },
  {
    categoryName: '駐車場',
    title: '来客用駐車場の利用方法を教えてください',
    body: `来客用駐車場（P1〜P3の3区画）をご利用いただけます。

【利用ルール】
- 2時間以内は無料
- 2時間を超える場合は管理事務所（内線10）へ事前申請が必要
- 入居者本人の車両はご利用いただけません（契約駐車場をご利用ください）

来客駐車中は管理事務所への連絡をお忘れなく。引越しシーズン等の繁忙期は利用できない場合があります。`,
    access_count: 98,
    tagNames: [],
  },
  // 騒音・マナー
  {
    categoryName: '騒音・マナー',
    title: '騒音・生活音のトラブルを相談したい',
    body: `騒音に関するご相談はサポートデスクまでご連絡ください。相手のお部屋番号が判明している場合はあわせてお知らせください。

【対応の流れ】
1. 管理会社が状況を確認・記録
2. 該当者へ注意喚起文を配布または口頭で注意
3. 改善されない場合は再三の注意・警告

入居者様が直接ドアをノックするなど個人間での解決を試みることはトラブル悪化につながりますのでご遠慮ください。深夜・早朝の騒音は夜間緊急窓口でも受け付けています。`,
    access_count: 255,
    tagNames: ['緊急', '夜間対応'],
  },
  // 共用部
  {
    categoryName: '共用部',
    title: '廊下・エントランスの電球が切れている',
    body: `共用部（廊下・エントランス・階段・駐車場など）の電球交換は管理会社が対応します。入居者様が自ら交換する必要はありません。

【連絡方法】
場所（〇階廊下、エントランス右側など）を具体的にお知らせの上、サポートデスクまたは問い合わせフォームからご連絡ください。

通常、連絡受領後3〜5営業日以内に対応します。急を要する場合はお電話でご連絡ください。`,
    access_count: 215,
    tagNames: ['清掃', '工事'],
  },
  {
    categoryName: '共用部',
    title: 'エレベーターが動かない・故障している',
    body: `エレベーターが停止している場合は以下をご確認ください。

1. 扉が完全に閉まっているか確認する（半開きでは動きません）
2. 月1回の定期点検中でないか確認する（点検票が掲示されます）
3. 停電・火災報知器連動で停止していないか確認する

以上に該当しない場合は、エレベーター内の緊急コールボタンを押すか、管理事務所（24時間対応）までご連絡ください。閉じ込められた場合は、無理に扉を開けようとせず緊急コールボタンをお使いください。`,
    access_count: 180,
    tagNames: ['設備故障', '緊急', '夜間対応'],
  },
  {
    categoryName: '共用部',
    title: 'インターネット・Wi-Fiがつながらない',
    body: `本物件は全室インターネット無料（共用回線）が付帯しています。

【まず試してください】
1. Wi-Fiルーターの電源を一度抜き、1分後に再接続する
2. お使いの端末のWi-Fi設定を一度オフにし、再度オンにして再接続する
3. ネットワーク名（SSID）「BuildingFreeWiFi」を選択する

上記で改善しない場合はサポートデスクまでご連絡ください。通信事業者側の障害情報も確認します。`,
    access_count: 305,
    tagNames: ['設備故障'],
  },
  // 契約・手続き
  {
    categoryName: '契約・手続き',
    title: '家賃の振込先・支払い方法を確認したい',
    body: `家賃は毎月27日までに翌月分をお振り込みください。

【振込先口座】
振込先は「賃貸借契約書」または「重要事項説明書」に記載されています。不明な場合はサポートデスクへお問い合わせください。

【振込時の注意】
- 振込名義は契約者名（カタカナ）でお振り込みください
- 振込手数料はご入居者様のご負担となります
- 口座引き落とし（自動振替）への変更を希望される場合は管理事務所へご相談ください`,
    access_count: 390,
    tagNames: ['更新'],
  },
  {
    categoryName: '契約・手続き',
    title: '退去・引越しの手続きを教えてください',
    body: `退去の際は以下の手順で手続きをお願いします。

1. 退去希望日の1か月前までに書面またはメールで解約を申し入れる
2. 管理会社から退去立会い日程の連絡が届く
3. 退去立会い（原状回復の確認）
4. 鍵の返却
5. 敷金精算（立会いから1〜2か月後）

引越し作業は管理事務所への事前申請が必要です。エレベーターの養生等を手配します。クリーニング費用はご入居者様負担となります。`,
    access_count: 230,
    tagNames: ['解約'],
  },
  {
    categoryName: '契約・手続き',
    title: '鍵を紛失した・部屋に閉め出された',
    body: `【鍵を紛失した場合】
速やかにサポートデスクへご連絡ください。セキュリティ上、シリンダー交換を推奨します。費用はご入居者様のご負担となります。

【閉め出し（インロック）の場合】
24時間対応の緊急窓口にお電話ください。開錠費用は実費（夜間・休日は割増）となります。

合鍵の作製は必ず管理会社への事前申請・承認が必要です。無断での合鍵作製は契約違反となります。スペアキーの預かりサービスも行っています（要申請）。`,
    access_count: 175,
    tagNames: ['緊急', '夜間対応'],
  },
  {
    categoryName: '契約・手続き',
    title: 'ペット飼育・同居人を追加したい',
    body: `【ペットを飼育したい場合】
ペットの飼育は事前に管理会社への申請と承認が必要です。物件によってはペット不可の場合があります。まずサポートデスクへお問い合わせください。承認される場合、ペット飼育細則への同意・ペット敷金の追加などの手続きが必要です。

【同居人を追加したい場合】
入居者の変更・追加も事前申請が必要です。入居審査が必要な場合があります。

無断でのペット飼育・同居人追加は契約違反となり、退去を求められる場合があります。`,
    access_count: 120,
    tagNames: ['更新'],
  },
];
