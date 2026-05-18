Gemini Flash Veri Goruntuleyici (Portable)

PROJE KONUSU
- AI destekli AML (kara para aklama) analiz demo uygulamasi.
- Fikir: Musteri islemlerini "insan hayati hikayesi" olarak yorumlayip,
  Gemini Flash ile aciklanabilir suphe analizi uretmek.

AMAC
- Tikanan musteri icin ham veriyi gostermek.
- Kategori, kanal, para birimi, sinir otesi akis gibi davranislari anlamak.
- Hazir risk etiketi kullanmadan, analizi modele birakmak.

NEDEN BU VERI FORMATI
- Veri setinde risk_score / suspicious_label / laundering_type gibi
  model sonucunu ele veren kolonlar yoktur.
- Bu sayede model, kendi cikarimi ile gerekceli yorum uretir.

OLMASI GEREKEN ANA VERI BLOKLARI
1) Musteri profili
	- customer_id, full_name, date_of_birth, nationality, residency
	- occupation, monthly_income_try, current_debt_try
	- pep_flag, sanctions_flag, watchlist_flag
2) Hesap profili
	- account_id, account_no, iban, branch_code, branch_name
	- account_currency, opening_balance, current_balance, credit_limit
3) Islem kayitlari
	- transaction_datetime, direction, amount, currency, amount_try
	- transaction_type, channel, category, sub_category, payment_purpose
	- counterparty_country/city/bank/bic
	- source-destination ulke/sehir/koordinat
	- device/ip/cash/card_present/remote/cross_border

PAKET ICERIGI
- viewer_app.js
- viewer_page.html
- run_viewer.bat
- stop_viewer.bat
- data\gemini_flash_ready_v1\customers.csv
- data\gemini_flash_ready_v1\accounts.csv
- data\gemini_flash_ready_v1\transactions_part1.csv
- data\gemini_flash_ready_v1\transactions_part2.csv
- data\gemini_flash_ready_v1\customer_transaction_summary.csv
- data\gemini_flash_ready_v1\manifest.json
- DATA_SPEC.txt

CALISTIRMA
1) run_viewer.bat dosyasina cift tikla
2) Tarayicida http://localhost:4080 acilir

KAPATMA
- run_viewer.bat penceresinde Ctrl+C
veya
- stop_viewer.bat

NOTLAR
- Node.js gerekli (v18+ onerilir)
- Dataset ham davranis verisidir; hazir AML karar kolonu icermez.
