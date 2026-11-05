import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Inicializa o app do Firebase reutilizando instância se já existir
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Escopo de acesso necessário para gerenciar eventos na Google Agenda
export const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Inicializa o listener de autenticação
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Realiza o login com a conta Google e armazena o token em memória
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter o token de acesso da conta Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Erro no login com Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Retorna o token de acesso em cache de memória
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Encerra a sessão
export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
