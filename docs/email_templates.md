# Templates de E-mail Profissionais - CaçambaGo

Estes templates foram projetados para serem colados diretamente no Dashboard do Supabase (**Auth -> Email Templates**). Eles são responsivos e seguem a identidade visual premium do sistema.

---

## 1. Confirmação de Cadastro (Confirm Signup)

**Assunto:** 🚀 Bem-vindo ao CaçambaGo! Confirme seu e-mail

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #0f172a; border-radius: 24px; padding: 40px; border: 1px solid #1e293b; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: 900; color: #ffffff; text-transform: uppercase; font-style: italic; letter-spacing: -1px; }
    .logo span { color: #facc15; }
    .title { font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 20px; color: #ffffff; }
    .content { line-height: 1.6; color: #94a3b8; font-size: 16px; text-align: center; }
    .code-box { background: #1e293b; border-radius: 16px; padding: 24px; margin: 30px 0; border: 2px dashed #facc15; }
    .code { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #facc15; font-family: monospace; }
    .footer { font-size: 12px; color: #475569; text-align: center; margin-top: 40px; }
    .btn { display: inline-block; background: #facc15; color: #000000; font-weight: 800; padding: 14px 40px; border-radius: 12px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Caçamba<span>Go</span></div>
    </div>
    <div class="title">Verifique seu endereço de e-mail</div>
    <p class="content">Olá! Estamos quase lá. Para concluir a criação da sua conta no CaçambaGo, utilize o código de verificação abaixo:</p>
    <div class="code-box">
      <div class="code">{{ .Token }}</div>
    </div>
    <p class="content" style="font-size: 14px;">Este código é válido por 30 minutos. Se você não solicitou este cadastro, pode ignorar este e-mail com segurança.</p>
    <div class="footer">
      &copy; 2026 CaçambaGo Systems. A logística de resíduos inteligente.
    </div>
  </div>
</body>
</html>
```

---

## 2. Recuperação de Senha (Reset Password)

**Assunto:** 🔑 Recuperação de Senha - CaçambaGo

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #0f172a; border-radius: 24px; padding: 40px; border: 1px solid #1e293b; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: 900; color: #ffffff; text-transform: uppercase; font-style: italic; letter-spacing: -1px; }
    .logo span { color: #facc15; }
    .title { font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 20px; color: #ffffff; }
    .content { line-height: 1.6; color: #94a3b8; font-size: 16px; text-align: center; }
    .code-box { background: #1e293b; border-radius: 16px; padding: 24px; margin: 30px 0; border: 2px dashed #3b82f6; }
    .code { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #3b82f6; font-family: monospace; }
    .footer { font-size: 12px; color: #475569; text-align: center; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Caçamba<span>Go</span></div>
    </div>
    <div class="title">Recuperação de Acesso</div>
    <p class="content">Recebemos uma solicitação para redefinir a senha da sua conta. Use o código abaixo para prosseguir:</p>
    <div class="code-box">
      <div class="code">{{ .Token }}</div>
    </div>
    <p class="content" style="font-size: 14px;">Se você não solicitou a troca de senha, sua conta continua segura e você pode ignorar este e-mail.</p>
    <div class="footer">
      &copy; 2026 CaçambaGo Systems. Suporte Técnico.
    </div>
  </div>
</body>
</html>
```
