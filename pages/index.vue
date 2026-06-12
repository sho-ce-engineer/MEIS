<template>
  <div>
    <v-container fluid class="d-flex">
      <v-row>
        <v-col cols="12" md="8" class="left-column d-none d-md-flex">
          <v-slide-y-reverse-transition>
            <div class="lc-copy__wrapper" v-if="transitionOnMounted">
              <p>紙からデジタル、そしてクラウドへ。</p>
              <p>医療機器管理のすべてを手のひらで。</p>
            </div></v-slide-y-reverse-transition
          >
        </v-col>
        <v-col
          cols="12"
          md="4"
          class="right-column d-flex align-center flex-column"
        >
          <h1>M.E.I.S</h1>
          <v-slide-x-reverse-transition>
            <v-card
              class="pa-4"
              v-if="transitionOnMounted"
              max-width="750px"
              style="width: 100%"
            >
              <AuthInviteForm v-if="isInvite" />
              <template v-else>
                <v-card-title>{{
                  isLogin ? 'ようこそ！' : '新規登録'
                }}</v-card-title>
                <v-card-subtitle>
                  {{
                    isLogin
                      ? 'アカウントにサインインして日々の業務を開始しましょう!'
                      : 'アカウントを作成して利用を開始しましょう!'
                  }}
                </v-card-subtitle>
                <v-card-text>
                  <AuthLoginForm v-if="isLogin" />
                  <AuthSignupForm v-else />
                  <p class="loginCard__privacy-policy-txt">
                    サインインまたはサインアップすると、M.E.I.Sの
                    <v-dialog max-width="800">
                      <template v-slot:activator="{ props: openTermsOfUse }">
                        <a v-bind="openTermsOfUse" class="clickable-text">
                          利用規約</a
                        >
                      </template>

                      <template v-slot:default="{ isActive }">
                        <v-card class="Dialogs">
                          <v-card-title
                            ><v-icon class="mr-2">mdi-alert-octagon</v-icon
                            >M.E.I.S 利用規約</v-card-title
                          >
                          <v-divider></v-divider>
                          <v-card-text
                            ><p>
                              この利用規約（以下「本規約」といいます。）は、<a
                                href="https://coils-net.net/"
                                >CoilsNet</a
                              >（以下「当社」といいます。）が提供するクラウド型医療機器点検記録管理サービス「M.E.I.S」（以下「本サービス」といいます。）の利用に関する条件を定めるものです。本サービスを利用する前に、必ず本規約をお読みください。
                            </p>
                            <h2>第1条（適用）</h2>
                            <ol>
                              <li>
                                本規約は、本サービスの利用に関するすべての事項に適用されます。
                              </li>
                              <li>
                                当社は、本規約に同意した場合に限り、本サービスを提供します。
                              </li>
                            </ol>
                            <h2>第2条（定義）</h2>
                            <p>
                              本規約において使用される用語の定義は、以下のとおりとします。
                            </p>
                            <ol>
                              <li>
                                「ユーザー」とは、本サービスを利用する個人または法人を指します。
                              </li>
                              <li>
                                「アカウント」とは、ユーザーが本サービスを利用するために必要なIDおよびパスワードを含む、ユーザーの識別情報を指します。
                              </li>
                            </ol>
                            <h2>第3条（利用登録）</h2>
                            <ol>
                              <li>
                                ユーザーは、本サービスの利用を希望する場合、所定の手続きに従い、利用登録を行う必要があります。
                              </li>
                              <li>
                                当社は、利用登録の申請を受け付けた後、必要に応じて審査を行い、登録を承認または否認します。この際に発生した損害について、当社は一切の責任を負わないものとします。
                              </li>
                            </ol>
                            <h2>第4条（ユーザーの責任）</h2>
                            <ol>
                              <li>
                                ユーザーは、自己のアカウントの管理および利用に関する責任を負います。
                              </li>
                              <li>
                                アカウントの不正使用による損害について、当社は一切の責任を負わないものとします。
                              </li>
                            </ol>
                            <h2>第5条（禁止事項）</h2>
                            <p>
                              ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
                            </p>
                            <ul>
                              <li>法令に違反する行為</li>
                              <li>公序良俗に反する行為</li>
                              <li>他のユーザーや第三者の権利を侵害する行為</li>
                              <li>本サービスの運営を妨害する行為</li>
                            </ul>
                            <h2>第6条（サービスの変更・中断・終了）</h2>
                            <ol>
                              <li>
                                当社は、事前に通知することなく、本サービスの内容を変更、または一時的に中断することがあります。
                              </li>
                              <li>
                                当社は、必要と判断した場合には、本サービスを終了することがあります。
                              </li>
                            </ol>
                            <h2>第7条（アカウントの削除）</h2>
                            <ol>
                              <li>
                                当社は、ユーザーが以下のいずれかに該当すると判断した場合、利用者の同意なしにアカウントを削除できるものとします。
                              </li>
                              <ul>
                                <li>本規約に違反した場合</li>
                                <li>不正な行為があった場合</li>
                                <li>その他、当社が妥当と判断した場合</li>
                              </ul>
                            </ol>
                            <h2>第8条（規約の変更）</h2>
                            <ol>
                              <li>
                                当社は、本規約を随時変更することができ、変更後の規約は、当社が定める方法で通知した時点から効力を生じます。ユーザーの同意は必要ありません。
                              </li>
                            </ol>
                            <h2>第9条（免責事項）</h2>
                            <ol>
                              <li>
                                当社は、本サービスに関する情報の正確性、完全性を保証するものではありません。
                              </li>
                              <li>
                                当社は、データ・個人情報の取り扱いには細心の注意を払っていますが、万が一の際（情報漏洩や不正アクセス）による被害・損害に対して一切の責任を負わないものとします。
                              </li>
                              <li>
                                本サービスの利用に関連して発生したいかなる損害についても、当社は責任を負わないものとします。
                              </li>
                            </ol>
                            <h2>第10条（個人情報の取り扱い）</h2>
                            <p>
                              当社は、ユーザーの個人情報を適切に取り扱い、プライバシーポリシーに従って管理します。
                            </p>
                            <h2>第11条（準拠法及び管轄）</h2>
                            <p>
                              本規約は、日本法に準拠し、本サービスに関する紛争については、当社の本社所在地を管轄する裁判所を専属的合意管轄裁判所とします。
                            </p>
                          </v-card-text>
                          <v-divider></v-divider>
                          <v-card-actions
                            ><v-spacer></v-spacer
                            ><v-btn
                              @click="isActive.value = false"
                              color="primary"
                              >閉じる</v-btn
                            ></v-card-actions
                          >
                        </v-card>
                      </template></v-dialog
                    >
                    と
                    <v-dialog max-width="800">
                      <template v-slot:activator="{ props: openPrivacyPolicy }">
                        <a v-bind="openPrivacyPolicy" class="clickable-text">
                          プライバシーポリシー</a
                        >
                      </template>

                      <template v-slot:default="{ isActive }">
                        <v-card class="Dialogs">
                          <v-card-title
                            ><v-icon class="mr-2">mdi-alert-octagon</v-icon
                            >M.E.I.S プライバシーポリシー</v-card-title
                          >
                          <v-divider></v-divider>
                          <v-card-text>
                            <p>
                              このプライバシーポリシー（以下「本ポリシー」といいます。）は、<a
                                href="https://coils-net.net/"
                                >CoilsNet</a
                              >（以下「当社」といいます。）が提供するクラウド型医療機器点検記録管理サービス「M.E.I.S」（以下「本サービス」といいます。）におけるユーザーの個人情報の取り扱いについて定めるものです。
                            </p>
                            <p>
                              本サービスをご利用いただく前に、本ポリシーをよくお読みください。
                            </p>
                            <h2>第1条（個人情報の定義）</h2>
                            <p>
                              本ポリシーにおいて「個人情報」とは、ユーザーに関する情報であって、氏名、住所、電話番号、メールアドレス、その他の情報により特定の個人を識別できるものを指します。
                            </p>
                            <h2>第2条（個人情報の収集）</h2>
                            <p>当社は、以下の情報を収集することがあります。</p>
                            <ul>
                              <li>
                                ユーザー登録時に提供される情報（氏名、メールアドレス、パスワードなど）
                              </li>
                              <li>
                                本サービスの利用に伴って自動的に収集される情報（利用履歴、IPアドレス、ブラウザの種類など）
                              </li>
                            </ul>
                            <h2>第3条（個人情報の利用目的）</h2>
                            <p>
                              当社は、収集した個人情報を以下の目的で利用します。
                            </p>
                            <ul>
                              <li>本サービスの提供および運営</li>
                              <li>ユーザーからのお問い合わせに対する対応</li>
                              <li>本サービスに関する重要なお知らせの送信</li>
                              <li>
                                利用状況の分析およびサービス改善のための統計データ作成
                              </li>
                            </ul>
                            <h2>第4条（個人情報の第三者提供）</h2>
                            <p>
                              当社は、以下の場合を除いて、ユーザーの同意なく個人情報を第三者に提供することはありません。
                            </p>
                            <ul>
                              <li>法令に基づく場合</li>
                              <li>
                                人の生命、身体、または財産の保護のために必要な場合
                              </li>
                              <li>
                                公衆衛生の向上や児童の健全な育成に特に必要がある場合
                              </li>
                              <li>その他、特別の理由がある場合</li>
                            </ul>
                            <h2>第5条（個人情報の管理）</h2>
                            <p>
                              当社は、ユーザーの個人情報を適切に管理し、漏洩、紛失、不正アクセスなどの防止に努めます。個人情報の取り扱いに関する従業員教育やアクセス制限を行い、安全管理措置を講じます。
                            </p>
                            <h2>第6条（個人情報の開示・訂正・削除）</h2>
                            <p>
                              ユーザーは、当社に対して自らの個人情報の開示、訂正、削除を求めることができます。これに関する手続きについては、当社のお問い合わせ窓口までご連絡ください。
                            </p>
                            <h2>第7条（クッキーの利用）</h2>
                            <p>
                              当社は、ユーザーの利便性向上のため、クッキーを使用することがあります。クッキーとは、Webサイトがユーザーのブラウザに保存する小さなデータファイルのことです。ユーザーは、ブラウザの設定によりクッキーの受け入れを拒否することができますが、その場合、本サービスの一部が利用できなくなることがあります。
                            </p>
                            <h2>第8条（プライバシーポリシーの変更）</h2>
                            <p>
                              当社は、本ポリシーを随時変更することがあります。変更後のポリシーは、当社が定める方法で通知した時点から効力を生じます。
                            </p>
                            <h2>第9条（お問い合わせ窓口）</h2>
                            <p>
                              本ポリシーに関するお問い合わせは、問い合わせフォームでご連絡ください。
                            </p>
                          </v-card-text>
                          <v-divider></v-divider>
                          <v-card-actions
                            ><v-spacer></v-spacer
                            ><v-btn
                              @click="isActive.value = false"
                              color="primary"
                              >閉じる</v-btn
                            ></v-card-actions
                          ></v-card
                        ></template
                      ></v-dialog
                    >に同意したことになります。
                  </p>
                  <v-btn
                    @click="toggleForm"
                    variant="text"
                    class="ml-auto d-block text-primary"
                  >
                    {{
                      isLogin
                        ? '新規登録はこちら'
                        : '既にアカウントをお持ちですか？ログイン'
                    }}
                  </v-btn>
                </v-card-text></template
              >
            </v-card></v-slide-x-reverse-transition
          >
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/Dashboard',
  },
});

const isLogin = ref(false);
const isInvite = ref(false);
const route = useRoute();

const toggleForm = () => {
  isLogin.value = !isLogin.value;
};
const transitionOnMounted = ref(false);

onMounted(() => {
  const hasVisitedDashboard = localStorage.getItem('hasVisitedDashboard');
  if (hasVisitedDashboard) {
    isLogin.value = true;
  } else {
    isLogin.value = route.query.action === 'login';
  }
  isInvite.value = !!route.query.invite;
  transitionOnMounted.value = true;
});
</script>

<style scoped>
.v-container {
  padding: 0;
}
.left-column {
  background-image: url(../assets/meis.webp);
  background-size: cover;
  background-position: 70%;
  align-items: flex-end;
}
.lc-copy__wrapper {
  padding-bottom: 15vh;
  padding-left: 5vw;
}
.lc-copy__wrapper p {
  font-size: 2.5rem;
  color: #ffffff;
  text-shadow: #000 1px 0 10px;
  font-family: 'BIZ UDMincho', serif;
  font-weight: 400;
  font-style: normal;
}
.right-column {
  background-color: #ffffff;
  height: 100vh;
  padding-top: 110px !important;
  overflow-y: auto;
}
form {
  margin-bottom: 22px;
}
h1 {
  font-size: 4rem;
  margin-bottom: 2.5rem;
}
.v-card {
  overflow-y: auto;
}
.v-card-title {
  font-size: 1.5rem;
}
.v-card--variant-elevated {
  box-shadow: none;
}
.v-card-subtitle {
  font-size: 14px;
  overflow: unset;
  white-space: normal;
}
.loginCard__privacy-policy-txt {
  font-size: 12px;
}
@media only screen and (max-width: 600px) {
  .left-column {
    display: none;
  }
}
.login-img {
  height: 100%;
}
.slide-y-reverse-transition-enter-active {
  transition-duration: 0.8s !important;
  transition-timing-function: cubic-bezier(0.02, 0.64, 0.36, 1) !important;
}
.slide-x-reverse-transition-enter-active {
  transition-duration: 0.8s !important;
  transition-timing-function: cubic-bezier(0.02, 0.64, 0.36, 1) !important;
}
.clickable-text {
  cursor: pointer;
  color: blue;
  text-decoration: underline;
}
.Dialogs .v-card-text {
  line-height: 1.6 !important;
}
.Dialogs h2 {
  margin-top: 1.5rem;
}
.Dialogs ol,
ul {
  margin-left: 1.5rem;
}
</style>
