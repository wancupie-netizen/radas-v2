import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const model = 'gpt-5-mini'
const promptVersion = 'radas-research-v2-structured-brief'

const gmvMaxContexts = {
  confirmed_active: 'Disahkan aktif — seller menunjukkan signal sokongan distribution atau paid promotion melalui GMV Max.',
  indicated: 'Ada petunjuk sokongan melalui GMV Max, tetapi status itu belum disahkan.',
  unknown: 'Tidak diketahui — tiada maklumat mencukupi dan jangan membuat andaian sama ada GMV Max aktif atau tidak.',
  inactive: 'Tidak aktif berdasarkan maklumat yang dimasukkan — tiada signal sokongan GMV Max untuk produk ini.',
} as const

const researchSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    research_snapshot: { type: 'string', description: 'Ringkasan padat produk dan peluang affiliate dalam Bahasa Melayu Malaysia.' },
    research_brief: {
      type: 'object',
      additionalProperties: false,
      properties: {
        summary: { type: 'string', description: 'Ringkasan 2 hingga 3 ayat, maksimum 320 aksara.' },
        facts: {
          type: 'array',
          maxItems: 4,
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              label: { type: 'string', description: 'Label ringkas maksimum 24 aksara.' },
              value: { type: 'string' },
              status: { type: 'string', enum: ['verified', 'seller_claim', 'unknown'] },
            },
            required: ['label', 'value', 'status'],
          },
        },
        demand: { type: 'string', description: 'Permintaan atau masalah asas, maksimum 120 aksara.' },
        content_opportunity: { type: 'string', description: 'Daya tarikan untuk content, maksimum 140 aksara.' },
        risk: { type: 'string', description: 'Risiko utama secara berhati-hati, maksimum 160 aksara.' },
        verification_items: { type: 'array', maxItems: 6, items: { type: 'string' } },
      },
      required: ['summary', 'facts', 'demand', 'content_opportunity', 'risk', 'verification_items'],
    },
    product_pain: { type: 'string', description: 'Masalah utama pengguna yang cuba diselesaikan, berdasarkan fakta produk tanpa mereka tuntutan.' },
    verdict: { type: 'string', enum: ['layak_diuji', 'perlu_dipantau', 'tidak_disyorkan'] },
    verdict_reason: { type: 'string', description: 'Sebab editorial yang jelas tanpa skor angka.' },
    research_insight: { type: 'string', description: 'Analisis masalah pengguna, daya tarikan produk, risiko dan batas maklumat.' },
    suitable_for: { type: 'array', items: { type: 'string' } },
    content_angles: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          hook: { type: 'string' },
          rationale: { type: 'string' },
        },
        required: ['title', 'hook', 'rationale'],
      },
    },
    execution_playbook: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          step: { type: 'string' },
          action: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['step', 'action', 'notes'],
      },
    },
  },
  required: ['research_snapshot', 'research_brief', 'product_pain', 'verdict', 'verdict_reason', 'research_insight', 'suitable_for', 'content_angles', 'execution_playbook'],
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const openAiKey = Deno.env.get('OPENAI_API_KEY')
  if (!supabaseUrl || !serviceRoleKey || !openAiKey) return json({ error: 'Server configuration is incomplete.' }, 500)

  const authorization = request.headers.get('Authorization')
  const accessToken = authorization?.replace(/^Bearer\s+/i, '')
  if (!accessToken) return json({ error: 'Authentication required.' }, 401)

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: userData, error: userError } = await admin.auth.getUser(accessToken)
  if (userError || !userData.user) return json({ error: 'Invalid or expired session.' }, 401)

  const { data: profile } = await admin.from('profiles').select('role').eq('id', userData.user.id).single()
  if (!profile || !['admin', 'editor'].includes(profile.role)) return json({ error: 'Staff access required.' }, 403)

  let researchId = ''
  try {
    const body = await request.json()
    researchId = typeof body.researchId === 'string' ? body.researchId : ''
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }
  if (!researchId) return json({ error: 'researchId is required.' }, 400)

  const { data: research, error: researchError } = await admin
    .from('researches')
    .select('id, product_name, category, platform, price, commission_amount, commission_rate, product_url, official_description, gmv_max_status')
    .eq('id', researchId)
    .single()
  if (researchError || !research) return json({ error: 'Research was not found.' }, 404)

  const gmvMaxStatus = research.gmv_max_status in gmvMaxContexts
    ? research.gmv_max_status as keyof typeof gmvMaxContexts
    : 'unknown'
  const inputSnapshot = {
    product_name: research.product_name,
    category: research.category,
    platform: research.platform,
    price: research.price,
    commission_amount: research.commission_amount,
    commission_rate: research.commission_rate,
    product_url: research.product_url,
    official_description: research.official_description,
    gmv_max_status: gmvMaxStatus,
  }
  const aiInput = { ...inputSnapshot, gmv_max_status: gmvMaxContexts[gmvMaxStatus] }

  const { data: run, error: runError } = await admin.from('research_generation_runs').insert({
    research_id: research.id,
    requested_by: userData.user.id,
    status: 'running',
    provider: 'openai',
    model,
    prompt_version: promptVersion,
    input_snapshot: inputSnapshot,
    started_at: new Date().toISOString(),
  }).select('id').single()
  if (runError || !run) return json({ error: 'Generation run could not be created.' }, 500)

  try {
    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        instructions: [
          'Anda ialah editor research produk RADAS untuk affiliate Malaysia.',
          'Gunakan Bahasa Melayu Malaysia yang jelas, profesional dan mudah dibaca.',
          'Nilai potensi berdasarkan maklumat yang diberikan sahaja. Jangan mereka data jualan, trend, testimoni atau tuntutan kesihatan.',
          'Jika bukti tidak mencukupi, nyatakan batas maklumat dan pilih verdict perlu_dipantau.',
          'Jangan gunakan skor angka, bintang atau dakwaan pendapatan.',
          'Anggap gmv_max_status hanya sebagai Seller Support Signal tambahan, bukan scoring mutlak atau penentu tunggal verdict.',
          'Gunakan interpretasi status GMV Max dalam input sebagai konteks semula jadi dan jangan paparkan nilai enum teknikal atau nama kod status kepada pembaca.',
          'Jangan nyatakan atau menyiratkan bahawa GMV Max menjamin jualan affiliate, paid traffic, produk laku atau produk viral.',
          'Gunakan bahasa berhati-hati seperti seller menunjukkan signal sokongan melalui GMV Max dan jelaskan bahawa signal itu bukan jaminan prestasi affiliate.',
          'Hasilkan verdict secara kualitatif berdasarkan gabungan semua input research yang tersedia, bukan GMV Max sahaja.',
          'Hasilkan cadangan content yang praktikal, jujur dan sesuai untuk short-form affiliate content.',
          'Untuk research_brief, sesuaikan fakta dengan kategori produk; jangan gunakan set fakta yang sama untuk semua kategori.',
          'Hadkan summary kepada 320 aksara, demand 120 aksara, content_opportunity 140 aksara dan risk 160 aksara.',
          'Pilih maksimum empat fakta yang paling membantu keputusan. Gunakan status verified hanya untuk fakta jelas dalam input, seller_claim untuk dakwaan penjual, dan unknown jika belum diketahui.',
          'Pastikan setiap label fakta ringkas, mudah diimbas dan tidak melebihi 24 aksara. Contoh: Harga, Komisen, Kapasiti, Waranti.',
          'Jangan kira, anggar atau simpulkan kadar komisen daripada harga dan jumlah komisen. Paparkan peratus hanya jika commission_rate mempunyai nilai dalam input.',
          'Jika commission_rate tiada, paparkan commission_amount sahaja tanpa peratus dan jangan tandakan kadar yang dikira sebagai fakta daripada input.',
          'Jangan mereka nilai untuk fakta yang tiada. Tulis Belum diketahui dan masukkan perkara itu dalam verification_items.',
          'AI menyediakan draf editorial; jangan menyatakan bahawa produk telah disahkan atau terbukti tanpa bukti.',
        ].join('\n'),
        input: `Sediakan research berstruktur untuk data produk berikut:\n${JSON.stringify(aiInput, null, 2)}`,
        text: { format: { type: 'json_schema', name: 'radas_product_research', strict: true, schema: researchSchema } },
        max_output_tokens: 5000,
      }),
    })

    const openAiPayload = await openAiResponse.json()
    if (!openAiResponse.ok) throw new Error(openAiPayload?.error?.message || 'OpenAI request failed.')
    const outputText = openAiPayload.output
      ?.flatMap((item: { type?: string; content?: Array<{ type?: string; text?: string }> }) => item.type === 'message' ? item.content ?? [] : [])
      .find((content: { type?: string; text?: string }) => content.type === 'output_text')
      ?.text
    if (openAiPayload.status !== 'completed' || !outputText) throw new Error('OpenAI response was incomplete.')

    const output = JSON.parse(outputText)
    const inputTokens = openAiPayload.usage?.input_tokens ?? null
    const outputTokens = openAiPayload.usage?.output_tokens ?? null
    const estimatedCost = inputTokens === null || outputTokens === null ? null : (inputTokens * 0.25 + outputTokens * 2) / 1_000_000

    const { error: updateError } = await admin.from('researches').update({
      research_snapshot: output.research_snapshot,
      research_brief: output.research_brief,
      product_pain: output.product_pain,
      verdict: output.verdict,
      verdict_reason: output.verdict_reason,
      research_insight: output.research_insight,
      suitable_for: output.suitable_for,
      content_angles: output.content_angles,
      execution_playbook: output.execution_playbook,
      status: 'ai_generated',
    }).eq('id', research.id)
    if (updateError) throw updateError

    await admin.from('research_generation_runs').update({
      status: 'completed',
      output_snapshot: output,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd: estimatedCost,
      completed_at: new Date().toISOString(),
    }).eq('id', run.id)

    return json({ researchId: research.id, runId: run.id, model, usage: { inputTokens, outputTokens, estimatedCostUsd: estimatedCost }, output })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Research generation failed.'
    await admin.from('research_generation_runs').update({ status: 'failed', error_message: message.slice(0, 1000), completed_at: new Date().toISOString() }).eq('id', run.id)
    return json({ error: message }, 500)
  }
})
