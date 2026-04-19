import Foundation

/// Japanese furigana-style sub-labels rendered above their English equivalents
/// throughout the app. This is **purely aesthetic** — it is not localization.
/// The app stays English-first; the JP text is a stylistic flourish, gated
/// behind the `showJapanese` AppStorage flag (default `true`).
///
/// Translation choices follow conventions from real Japanese consumer apps
/// (Pairs, Tinder JP, Twitter JP, LINE) — katakana for English-origin nouns,
/// kanji for conceptual/role labels, hiragana when natural.
enum JPLabels {
    enum app {
        static let name = "エッコ・コネクト"
    }

    enum tabs {
        static let discover = "探索"
        static let likes    = "好き"
        static let matches  = "縁"
        static let profile  = "プロフィール"
    }

    enum screens {
        static let discover     = "探索"
        static let likes        = "好き"
        static let matches      = "縁"
        static let profile      = "プロフィール"
        static let settings     = "設定"
        static let profileSetup = "プロフィール作成"
        static let editProfile  = "プロフィール編集"
    }

    enum status {
        static let active  = "公開中"
        static let paused  = "停止中"
        static let visible = "表示"
        static let hidden  = "非表示"
    }

    enum actions {
        static let activate        = "公開"
        static let pause           = "停止"
        static let editProfile     = "編集"
        static let save            = "保存"
        static let cancel          = "キャンセル"
        static let done            = "完了"
        static let discardChanges  = "破棄"
        static let keepEditing     = "編集を続ける"
        static let activateProfile = "公開する"
        static let next            = "次へ"
        static let back            = "戻る"
        static let block           = "ブロック"
        static let report          = "報告"
        static let refresh         = "更新"
    }

    enum sections {
        static let about              = "自己紹介"
        static let headlineLocation   = "肩書き・場所"
        static let lookingFor         = "募集中"
        static let media              = "メディア"
        static let prompts            = "質問"
        static let socials            = "リンク"
    }

    enum stats {
        static let likesReceived = "いいね"
        static let likes         = "いいね"
        static let matches       = "マッチ"
        static let media         = "メディア"
        static let prompts       = "質問"
    }

    enum templates {
        static let `default` = "標準"
        static let hero      = "ヒーロー"
    }

    enum steps {
        static let template = "テンプレート"
        static let media    = "メディア"
        static let prompts  = "質問"
        static let details  = "詳細"
        static let preview  = "プレビュー"
    }

    enum settings {
        static let appearance      = "外観"
        static let showJapanese    = "日本語"
    }

    /// Lookup table for step names used in ProfileSetupView's dynamic
    /// step array. Keep in sync with `ProfileSetupView.steps`.
    static func step(_ english: String) -> String? {
        switch english {
        case "Template": return steps.template
        case "Media":    return steps.media
        case "Prompts":  return steps.prompts
        case "Details":  return steps.details
        case "Preview":  return steps.preview
        default: return nil
        }
    }
}
