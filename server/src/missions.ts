import { MissionInstructions, AssetType } from './types'

export const generateGenericMission = (
  assetType: AssetType,
  programma: string,
  _titolo: string
): MissionInstructions => {
  const baseTechniques: Record<AssetType, MissionInstructions['testingTechniques']> = {
    web: [
      {
        name: 'Ricognizione & Enumerazione',
        description: 'Mappa tutte le superfici attaccabili, endpoint, sottodomini e tecnologie usate',
        steps: [
          'Esegui subdomain enumeration con subfinder, amass, assetfinder',
          'Usa httpx per identificare servizi attivi',
          'Fai crawling con katana o gospider per scoprire endpoint',
          'Identifica tecnologie con Wappalyzer o whatweb',
          'Leggi robots.txt, sitemap.xml, security.txt'
        ]
      },
      {
        name: 'Test IDOR / BOLA',
        description: 'Verifica controlli di accesso sostituendo ID utente/risorsa nelle API/URL',
        steps: [
          'Crea due account (A e B) sul programma',
          'Identifica endpoint con ID numerici (/api/users/123, /orders/456)',
          'Sostituisci ID di A con ID di B nelle richieste',
          'Verifica se ricevi dati di B senza autorizzazione',
          'Testa anche UUID e ID encoded in base64'
        ],
        examplePayload: 'GET /api/users/12345 -> cambia in -> GET /api/users/67890'
      },
      {
        name: 'SQL Injection',
        description: 'Testa parametri input per injection SQL classiche e blind',
        steps: [
          'Identifica parametri con sqlmap --crawl',
          'Testa manualmente con payload base: apice, doppi apici, --, #',
          'Usa sqlmap -u "URL" --dbs --batch per conferma',
          "Testa anche blind SQL con time-based: ' OR SLEEP(5)--",
          'Verifica second-order SQL injection in update profile'
        ],
        examplePayload: "' OR 1=1-- -"
      },
      {
        name: 'XSS (Cross-Site Scripting)',
        description: 'Inietta JavaScript in input riflessi o memorizzati',
        steps: [
          'Testa ogni parametro riflesso con: script alert 1 script',
          'Verifica escaping di <, >, ", apice',
          'Testa in attributi HTML con onmouseover',
          'Usa event handler: img src x onerror alert 1',
          'Testa stored XSS in campi profilo, commenti, recensioni'
        ],
        examplePayload: '<svg/onload=alert(document.domain)>'
      },
      {
        name: 'SSRF (Server-Side Request Forgery)',
        description: 'Forza il server a fare richieste verso risorse interne',
        steps: [
          'Identifica parametri URL: ?url=, ?image=, ?redirect=',
          'Testa con 127.0.0.1, 169.254.169.254 (cloud metadata)',
          'Bypassa filtri con localhost@evil.com, 0.0.0.0',
          'Usa DNS rebinding con tools come singularity',
          'Verifica accesso a metadata AWS/GCP/Azure'
        ],
        examplePayload: 'http://169.254.169.254/latest/meta-data/'
      },
      {
        name: 'Authentication Bypass',
        description: 'Trova modi per bypassare login, OTP, 2FA',
        steps: [
          'Testa risposta su /api/login con credenziali vuote/invalide',
          'Verifica rate limiting su OTP/2FA',
          'Prova JWT manipulation: alg=none, alg=HS256 con public key',
          'Testa password reset con token di un altro utente',
          'Verifica session fixation e session hijacking'
        ]
      }
    ],
    api: [
      {
        name: 'API Endpoint Discovery',
        description: 'Mappa tutti gli endpoint API, parametri e metodi accettati',
        steps: [
          'Intercetta traffico con Burp Suite o OWASP ZAP',
          'Usa kiterunner o wordlists API comuni',
          'Testa metodi HTTP alternativi: PUT, DELETE, PATCH, OPTIONS',
          'Verifica GraphQL introspection se presente',
          'Leggi documentazione API pubblica su /docs, /swagger'
        ]
      },
      {
        name: 'Mass Assignment',
        description: 'Inietta campi non previsti nel body della richiesta',
        steps: [
          'Intercetta una richiesta PUT/POST normale',
          'Aggiungi campi come: isAdmin true, role admin, verified true',
          'Verifica se vengono accettati e modificano il tuo account',
          'Testa con campi PII: ssn, creditCard, password',
          'Prova con campi interni: internal_id, user_type'
        ],
        examplePayload: '{"username":"test","isAdmin":true,"role":"admin"}'
      },
      {
        name: 'Broken Object Level Authorization (BOLA)',
        description: "Accedi a oggetti di altri utenti cambiando ID",
        steps: [
          'Crea due account su due browser diversi',
          'Cattura tutte le richieste con oggetti (es. /api/orders/123)',
          "Sostituisci l'ID con uno dell'altro account",
          "Se ottieni risposta 200 con dati altrui = BOLA confermato",
          'Documenta sempre con screenshot prima/dopo'
        ]
      },
      {
        name: 'Rate Limiting Bypass',
        description: 'Bypassa limiti di velocità per brute force o scraping',
        steps: [
          'Identifica endpoint con rate limit (login, OTP, search)',
          'Prova header X-Forwarded-For, X-Real-IP, X-Originating-IP',
          'Cambia case del path: /API/Login vs /api/login',
          'Aggiungi parametri irrilevanti: ?a=1&a=2',
          'Usa IP rotation con proxy/VPN'
        ]
      },
      {
        name: 'GraphQL Specific',
        description: 'Testa vulnerabilità specifiche di GraphQL',
        steps: [
          'Abilita introspection con query: {__schema{types{name}}}',
          'Usa batch query per rate limit bypass',
          'Cerca field deprecated o hidden',
          'Testa nested query DoS con depth limiting',
          'Verifica authorization a livello di field, non solo oggetto'
        ]
      }
    ],
    mobile: [
      {
        name: 'Analisi APK/IPA Statica',
        description: 'Decompila e cerca secrets, endpoint, logica business',
        steps: [
          'Decompila APK con jadx o apktool',
          'Estrai IPA con unzip e class-dump',
          'Cerca stringhe hardcoded: API key, password, URL backend',
          'Controlla AndroidManifest.xml per exported components',
          'Usa MobSF per analisi automatica completa'
        ]
      },
      {
        name: 'Dynamic Analysis (Frida/Objection)',
        description: 'Hook runtime per bypassare controlli client-side',
        steps: [
          'Installa Frida server sul device rooted/emulator',
          'Usa objection per bypass SSL pinning: objection --gadget',
          'Hook metodi di autenticazione e validazione',
          'Intercetta traffico con Burp + proxy cert installato',
          'Testa deep link manipulation con adb shell am start'
        ]
      },
      {
        name: 'Local Data Storage',
        description: 'Verifica dati salvati in chiaro su device',
        steps: [
          'Root/jailbreak device per accesso completo',
          'Controlla /data/data/<app>/shared_prefs/',
          'Cerca database SQLite in /databases/',
          'Verifica Keychain iOS per dati sensibili',
          'Controlla log di sistema per info leakage'
        ]
      },
      {
        name: 'Certificate Pinning Bypass',
        description: 'Disabilita pinning per intercettare traffico HTTPS',
        steps: [
          'Usa objection: ios sslpinning disable / android sslpinning disable',
          'Frida script: frida-multiple-unpinning',
          'Modifica APK con apk-mitm per re-pin',
          'Per iOS: SSL Kill Switch 2 su device jailbroken',
          'Testa anche WebView traffic interception'
        ]
      }
    ],
    infrastructure: [
      {
        name: 'Port Scanning & Service Detection',
        description: 'Identifica tutti i servizi esposti',
        steps: [
          'Usa nmap -sV -sC -p- sui target autorizzati',
          'Version detection aggressivo: nmap -A',
          'Verifica servizi su porte non standard',
          'Usa masscan per scansione veloce',
          'Documenta versioni software per CVE lookup'
        ]
      },
      {
        name: 'Subdomain Takeover',
        description: 'Trova sottodomini che puntano a servizi non più utilizzati',
        steps: [
          'Enumera sottodomini con subfinder + amass',
          'Verifica CNAME con host o dig',
          'Controlla fingerprinter con: aquatone, httpx',
          'Testa takeover su: AWS S3, Heroku, GitHub Pages, Pantheon',
          'Usa nuclei con template subdomain-takeover'
        ]
      },
      {
        name: 'Cloud Misconfigurations',
        description: 'Trova bucket S3, blob Azure, GCS aperti',
        steps: [
          'Enumera con cloud_enum, s3scanner',
          'Testa permessi bucket S3 con aws s3 ls',
          'Verifica Azure blobs con restic o MicroBurst',
          'Controlla GCS con gsutil',
          'Cerca file .env, backups, database esposti'
        ]
      }
    ],
    hardware: [
      {
        name: 'Firmware Analysis',
        description: 'Estrai e analizza firmware dei dispositivi',
        steps: [
          'Usa binwalk per estrarre filesystem',
          'Cerca credenziali hardcoded in /etc/passwd, /etc/shadow',
          'Verifica chiavi SSH private nel firmware',
          'Cerca backdoor e servizi non documentati',
          'Testa UART, JTAG se accesso fisico disponibile'
        ]
      }
    ],
    other: [
      {
        name: 'Analisi Generica',
        description: 'Approccio metodico di bug hunting su tecnologia custom',
        steps: [
          'Identifica tutte le superfici di input/output',
          'Mappa flusso dati end-to-end',
          'Testa ogni input con fuzzing (boofuzz, radamsa)',
          'Verifica configurazioni di default e credenziali',
          'Documenta ogni anomalia con PoC riproducibile'
        ]
      }
    ]
  }

  const baseTools: Record<AssetType, string[]> = {
    web: ['Burp Suite Pro', 'OWASP ZAP', 'sqlmap', 'nuclei', 'ffuf', 'httpx', 'subfinder', 'katana', 'Waybackurls', 'Wappalyzer'],
    api: ['Burp Suite Pro', 'Postman/Insomnia', 'kiterunner', 'Arjun', 'ffuf', 'jwt_tool', 'GraphQL Voyager', 'nuclei'],
    mobile: ['Frida', 'Objection', 'MobSF', 'jadx', 'apktool', 'Burp Suite', 'adb', 'Xcode (iOS)'],
    infrastructure: ['nmap', 'masscan', 'nuclei', 'subfinder', 'amass', 'httpx', 'aquatone', 'Metasploit'],
    hardware: ['multimeter', 'logic analyzer', 'binwalk', 'firmware-mod-kit', 'UART/JTAG tools'],
    other: ['Burp Suite', 'nmap', 'Wireshark', 'browser DevTools', 'curl/wget']
  }

  const baseOwasp: string[] = [
    'A01:2021 - Broken Access Control',
    'A02:2021 - Cryptographic Failures',
    'A03:2021 - Injection (SQL, NoSQL, OS)',
    'A04:2021 - Insecure Design',
    'A05:2021 - Security Misconfiguration',
    'A07:2021 - Identification and Authentication Failures'
  ]

  const webOutOfScope = [
    'Attacchi DDoS / volumetrici',
    'Social engineering su dipendenti',
    'Test su ambienti di produzione con dati reali di utenti',
    'Spam o invio massivo di contenuti',
    'Vulnerabilità in browser di terze parti (es. Chrome bugs)',
    'Rate limiting issues senza impatto reale',
    'Self-XSS (richiede azione della vittima)',
    'Vulnerabilità che richiedono accesso fisico al device',
    'Clickjacking su pagine senza azioni sensibili',
    'Best practice senza impatto dimostrabile',
    'Username/email enumeration su form pubblici',
    'CSRF su endpoint non state-changing',
    'Vulnerabilità già note pubblicamente senza PoC aggiuntivo',
    'Problemi di SPF/DKIM/DMARC',
    'Mixed content warnings su pagine non autenticabili'
  ]

  const webReportingSteps = [
    '1. REGISTRAZIONE: Crea un account sul programma e metti il tuo handle di test in bio',
    '2. RACCOLTA PROVE: Cattura screenshot/video di OGNI step della riproduzione con timestamp',
    "3. MINIMIZZAZIONE: Crea un account demo e un account vittima (no dati reali)",
    '4. REDAZIONE REPORT: Segui il template del programma, includi: Summary, Impact, Steps to Reproduce, PoC, Remediation',
    '5. IMPATTO BUSINESS: Spiega sempre "What can an attacker do?" non solo "How does it work"',
    '6. CVSS SCORE: Calcola il punteggio CVSS v3.1 con cvss calculator',
    '7. SUBMIT: Carica su HackerOne/Bugcrowd/Intigriti e attendi triage (24-72h)',
    '8. DUPLICATI: Se è un dup, è normale. Continua a cacciare!',
    '9. RETEST: Dopo il fix, verifica che la patch funzioni davvero',
    '10. DISCLOSURE: Aspetta il permesso del programma prima di blog/tweet'
  ]

  const cleanName = programma.toLowerCase().replace(/\s+/g, '')

  return {
    scope: [
      `Tutti i domini *.${cleanName}.com`,
      `API su api.${cleanName}.com`,
      'App mobile su Google Play / App Store'
    ],
    outOfScope: webOutOfScope,
    owaspCategories: baseOwasp,
    testingTechniques: baseTechniques[assetType] || baseTechniques.web,
    rewardsBySeverity: [
      { severity: 'critical', min: 5000, max: 50000, bonus: 'Bonus reputazione + Hall of Fame' },
      { severity: 'high', min: 1500, max: 10000, bonus: 'Hall of Fame' },
      { severity: 'medium', min: 500, max: 2500 },
      { severity: 'low', min: 100, max: 500 },
      { severity: 'informational', min: 0, max: 100, bonus: 'Solo se impatto dimostrabile' }
    ],
    reportingSteps: webReportingSteps,
    toolsRecommended: baseTools[assetType] || baseTools.web,
    quickStartGuide: [
      `Step 1: Leggi TUTTO il policy del programma su ${programma}`,
      'Step 2: Configura Burp Suite con il proxy del tuo browser (FoxyProxy)',
      'Step 3: Crea due account: attaccante e vittima su due browser diversi',
      'Step 4: Mappa tutte le feature: signup, login, profilo, pagamenti, API',
      'Step 5: Inizia con OWASP Top 10 e tools automatici (nuclei, sqlmap)',
      'Step 6: Testa manualmente la business logic (sconti, ruoli, workflow)',
      'Step 7: Documenta OGNI cosa interessante',
      'Step 8: Scrivi un report chiaro con PoC riproducibile in 5 minuti',
      'Step 9: Submeti e rispondi velocemente a domande del triage',
      'Step 10: Studia i report pubblici (HackerOne Hacktivity) per imparare'
    ],
    estimatedTimeToFirstReport: assetType === 'web' ? '40-80 ore' : assetType === 'api' ? '30-60 ore' : '20-40 ore',
    difficulty: assetType === 'mobile' || assetType === 'hardware' ? 'advanced' : 'intermediate',
    tips: [
      '💡 Leggi almeno 50 report risolti su HackerOne Hacktivity prima di iniziare',
      '💡 Concentrati su UN programma per almeno 2 settimane',
      '💡 Le business logic bug pagano DI PIÙ delle XSS',
      '💡 I bug race condition sono sottovalutati ma pagati',
      '💡 Usa Wayback Machine (web.archive.org) per trovare endpoint dimenticati',
      '💡 Controlla sempre le API mobile vs web',
      '💡 Non riportare MAI self-XSS, clickjacking senza impatto',
      '💡 Impara Burp a livello avanzato: macro, match/replace, scanner',
      '💡 La qualità del report > quantità',
      '💡 Network: Discord Bugcrowd, NahamSec, InsiderPhD, STÖK'
    ]
  }
}
