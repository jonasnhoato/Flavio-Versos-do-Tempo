import { clerkClient } from "@clerk/express";

// Run once after the author submits an initial password through Replit Secrets.
// Never reset an existing user's password as a side effect of a server restart.
const email = process.env.AUTHOR_EMAIL?.trim().toLowerCase();
const password = process.env.AUTHOR_INITIAL_PASSWORD;
if (!email || !password) {
  console.error("Configure AUTHOR_EMAIL e AUTHOR_INITIAL_PASSWORD pelo formulário seguro.");
  process.exit(1);
}
try {
  const existing = await clerkClient.users.getUserList({ emailAddress: [email] });
  if (existing.data.length) {
    console.log("A conta do autor já existe. Use a recuperação de senha na tela de acesso, se necessário.");
  } else {
    await clerkClient.users.createUser({ emailAddress: [email], password });
    console.log("Conta do autor criada com sucesso. A senha não foi gravada no código.");
  }
} catch (error) {
  const codes = Array.isArray(error?.errors) ? error.errors.map(item => item.code).join(", ") : "erro_de_configuracao";
  console.error(`Não foi possível criar a conta (${codes}). Confira a configuração e use uma senha nova e forte.`);
  process.exit(1);
}