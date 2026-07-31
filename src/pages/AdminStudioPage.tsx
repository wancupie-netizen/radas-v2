import { ArrowRight, Info, Link2, Save, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'

export function AdminStudioPage() {
  const [generated, setGenerated] = useState(false)
  function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setGenerated(true) }

  return (
    <>
      <section className="page-heading"><span className="eyebrow">Admin workflow</span><h1>Research Studio</h1><p>Masukkan fakta asas produk. AI menyediakan draf untuk semakan manusia sebelum diterbitkan.</p></section>
      <div className="studio-layout">
        <form className="form-panel" onSubmit={handleSubmit}>
          <div className="panel-heading"><div><span>Langkah 1</span><h2>Maklumat produk</h2></div><span className="status-dot">Draf baharu</span></div>
          <div className="form-grid">
            <label className="field field-wide"><span>Nama produk</span><input required placeholder="Contoh: Portable Blender Pro" /></label>
            <label className="field"><span>Kategori</span><select required defaultValue=""><option value="" disabled>Pilih kategori</option><option>Home & Living</option><option>Health & Wellness</option><option>Beauty</option><option>Automotive</option></select></label>
            <label className="field"><span>Platform</span><select required defaultValue=""><option value="" disabled>Pilih platform</option><option>Shopee Affiliate</option><option>TikTok Shop</option><option>Involve Asia</option><option>Accesstrade</option><option>Lain-lain</option></select></label>
            <label className="field"><span>Harga</span><div className="input-prefix"><b>RM</b><input required inputMode="decimal" placeholder="0.00" /></div></label>
            <label className="field"><span>Komisen</span><div className="input-prefix"><b>RM</b><input required inputMode="decimal" placeholder="0.00" /></div></label>
            <label className="field field-wide"><span>Pautan produk</span><div className="input-icon"><Link2 size={17} /><input required type="url" placeholder="https://..." /></div></label>
            <label className="field field-wide"><span>Deskripsi rasmi</span><textarea required rows={7} placeholder="Tampal deskripsi rasmi daripada penjual atau platform..." /><small>AI menggunakan teks ini sebagai sumber. Pastikan fakta penting disertakan.</small></label>
          </div>
          <div className="form-actions"><button className="button button-ghost" type="button"><Save size={17} /> Simpan draf</button><button className="button button-primary" type="submit"><Sparkles size={17} /> Hasilkan research <ArrowRight size={16} /></button></div>
        </form>
        <aside className={`generation-panel ${generated ? 'generated' : ''}`}>
          <div className="ai-orb"><Sparkles size={26} /></div>
          {generated ? <><span className="eyebrow">Simulasi PC-001</span><h2>Foundation AI sudah bersedia</h2><p>Dalam fasa AI nanti, Snapshot, Verdict, Research Insight dan Execution Playbook akan muncul di sini untuk semakan.</p><button className="button button-secondary" onClick={() => setGenerated(false)}>Kembali ke borang</button></> : <><span className="eyebrow">AI Research Generator</span><h2>Output yang lebih cepat, keputusan tetap di tangan admin.</h2><p>Lengkapkan tujuh input produk. AI tidak akan menerbitkan research secara automatik.</p><div className="output-list"><span>01 <b>Research Snapshot</b></span><span>02 <b>Qualitative Verdict</b></span><span>03 <b>Research Insight</b></span><span>04 <b>Execution Playbook</b></span></div></>}
          <div className="ai-note"><Info size={16} /><span>Output AI mesti disemak dan diluluskan oleh admin.</span></div>
        </aside>
      </div>
    </>
  )
}