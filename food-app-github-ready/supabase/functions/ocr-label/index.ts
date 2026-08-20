import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OcrResult {
  product_name: string;
  ingredients: string;
  nutrition: {
    energy?: number;
    protein?: number;
    fat?: number;
    saturated_fat?: number;
    carbohydrate?: number;
    sugars?: number;
    fiber?: number;
    salt?: number;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(
        JSON.stringify({ error: "画像データが見つかりません。" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "OCR機能には OpenAI API キーが必要です。Supabase の Edge Function Secrets で OPENAI_API_KEY を設定してください。",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "あなたは食品パッケージの表示を読み取る専門家です。ユーザーが送信する食品パッケージの写真から、以下の情報を正確に読み取ってJSON形式で返してください。\n\n読み取る項目:\n1. product_name: 商品名（写真に表示されていれば）\n2. ingredients: 原材料名欄に書かれている全ての原材料を、カンマ区切りでそのまま書き写す\n3. nutrition: 栄養成分表示の数値（数値のみ、単位は除く）\n   - energy: エネルギー (kcal)\n   - protein: たんぱく質 (g)\n   - fat: 脂質 (g)\n   - saturated_fat: 飽和脂肪酸 (g)\n   - carbohydrate: 炭水化物 (g)\n   - sugars: 糖類 (g)\n   - fiber: 食物繊維 (g)\n   - salt: 食塩相当量 (g)\n\nルール:\n- 読み取れなかった項目は省略する（nullにしない）\n- 数値は数値型（number）で返す\n- 原材料名は表示されている順序そのままにする\n- 推測で補完せず、写真に書かれていることだけを返す\n- 必ず有効なJSONのみを返す（マークダウンコードブロックを使わない）",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "この食品パッケージの写真から、商品名・原材料名・栄養成分表示を読み取ってJSON形式で返してください。",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageBase64.startsWith("data:")
                      ? imageBase64
                      : `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 2000,
          temperature: 0,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI API error:", errText);
      return new Response(
        JSON.stringify({ error: "画像の読み取りに失敗しました。しばらくしてからもう一度お試しください。" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData?.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "画像から文字を読み取れませんでした。写真が鮮明か確認してください。" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed: OcrResult;
    try {
      parsed = JSON.parse(content);
    } catch {
      return new Response(
        JSON.stringify({ error: "読み取った結果の処理に失敗しました。写真を撮り直してください。" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("OCR function error:", err);
    return new Response(
      JSON.stringify({ error: "サーバーエラーが発生しました。" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
