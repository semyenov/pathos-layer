import type { CookieSameSite } from '@whatwg-node/cookie-store';

const COOKIE_NAME = 'auth-session';

export function addAuthTypes(builder: Builder) {
  const AccountType = builder.drizzleNode('accounts', {
    name: 'Account',
    id: { column: (account) => account.id },
    fields: (t) => ({
      userId: t.exposeID('userId'),
      providerId: t.exposeID('providerId'),
      accountId: t.exposeID('accountId'),
      accessToken: t.exposeString('accessToken', { nullable: true }),
      accessTokenExpiresAt: t.expose('accessTokenExpiresAt', { type: 'Date', nullable: true }),
      refreshToken: t.exposeString('refreshToken', { nullable: true }),
      refreshTokenExpiresAt: t.expose('refreshTokenExpiresAt', { type: 'Date', nullable: true }),
      idToken: t.exposeString('idToken', { nullable: true }),
      password: t.exposeString('password', { nullable: true }),
      scope: t.exposeString('scope', { nullable: true }),
      createdAt: t.expose('createdAt', { type: 'Date' }),
      updatedAt: t.expose('updatedAt', { type: 'Date' }),
      user: t.field({
        type: UserType,
        resolve: async (_, __, context) => {
          if (!context.member) {
            throw new Error('User not found');
          }

          const foundUser = await context.db.query.users.findFirst({
            where: { id: context.member.id },
          });
          if (!foundUser) {
            throw new Error('User not found');
          }

          return foundUser;
        },
      }),
    }),
  });


  const UserRoleEnumType = builder.enumType('UserRole', {
    values: {
      admin: { value: 'admin' },
      user: { value: 'user' },
    },
  });

  const UserType = builder.drizzleNode('users', {
    name: 'User',
    id: { column: (user) => user.id },
    fields: (t) => ({
      banExpires: t.expose('banExpires', { type: 'Date', nullable: true }),
      banned: t.exposeBoolean('banned', { nullable: true }),
      banReason: t.exposeString('banReason', { nullable: true }),
      emailVerified: t.exposeBoolean('emailVerified', { nullable: true }),
      image: t.exposeString('image', { nullable: true }),
      name: t.exposeString('name'),
      email: t.exposeString('email'),
      role: t.expose('role', { type: UserRoleEnumType, nullable: true }),
      createdAt: t.expose('createdAt', { type: 'Date', nullable: true }),
      updatedAt: t.expose('updatedAt', { type: 'Date', nullable: true }),
      members: t.relation('members', { nullable: true }),
      sessions: t.relation('sessions', { nullable: true }),
      accounts: t.relation('accounts', { nullable: true }),
    }),
  });

  // Query to get the current user
  const meQuery = builder.queryField('me', (t) =>
    t.field({
      type: UserType,
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, __, context) => {
        if (!context.session?.userId) {
          throw new Error('Not authenticated');
        }

        const foundUser = await context.db.query.users.findFirst({
          where: { id: context.session.userId },
          with: {
            members: {
              with: {
                organization: true,
              },
            },
            sessions: true,
            accounts: true,
          },
        });

        if (!foundUser) {
          throw new Error('User not found');
        }

        return foundUser;
      },
    })
  );

  // Query to get users (admin only)
  const usersQuery = builder.queryField('users', (t) =>
    t.field({
      type: [UserType],
      authScopes: {
        admin: true,
      },
      resolve: async (_, __, context) => {
        const foundUsers = await context.db.query.users.findMany();
        return foundUsers;
      },
    })
  );

  // Login input type
  const LoginInputType = builder.inputType('LoginInput', {
    fields: (t) => ({
      email: t.string({ required: true }),
      password: t.string({ required: true }),
    }),
  });

  // Register input type
  const RegisterInputType = builder.inputType('RegisterInput', {
    fields: (t) => ({
      name: t.string({ required: true }),
      email: t.string({ required: true }),
      password: t.string({ required: true }),
    }),
  });

  // Login mutation
  const loginMutation = builder.mutationField(
    'login',
    (t) =>
      t.field({
        type: 'String',
        args: {
          input: t.arg({ type: LoginInputType, required: true }),
        },
        resolve: async (_, { input }, context) => {
          const session = await context.auth.api.signInEmail({
            body: {
              email: input.email,
              password: input.password,
            },
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!session) {
            throw new Error('Invalid email or password');
          }

          return session.token;
        },
      })
  );

  // Register mutation
  const registerMutation = builder.mutationField(
    'register',
    (t) =>
      t.field({
        type: UserType,
        args: {
          input: t.arg({ type: RegisterInputType, required: true }),
        },
        resolve: async (_, { input }, context) => {
          const { user: { id: userId }, token } = await context.auth.api.signUpEmail({
            body: {
              name: input.name,
              email: input.email,
              password: input.password,
              role: 'user',
            },
          });

          if (!userId || !token) {
            throw new Error('Failed to create user');
          }

          const user = await context.db.query.users.findFirst({
            where: { id: userId },
          });

          if (!user) {
            throw new Error('Failed to create user');
          }

          const authContext = await context.auth.$context;
          const session = authContext.createAuthCookie(COOKIE_NAME);

          context.cookies.set({
            name: COOKIE_NAME,
            value: token,
            domain: session.attributes.domain ?? null,
            expires: session.attributes.expires ?? null,
            httpOnly: session.attributes.httpOnly,
            path: session.attributes.path,
            secure: session.attributes.secure,
            sameSite: session.attributes.sameSite as CookieSameSite,
          });

          return user;
        },
      })
  );

  // Logout mutation
  const logoutMutation = builder.mutationField('logout', (t) =>
    t.boolean({
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, __, context) => {
        const session = await context.auth.api.signOut({
          headers: { 'Content-Type': 'application/json' },
        });

        if (session.success) {
          context.cookies.delete(COOKIE_NAME);
          return true;
        }

        return false;
      },
    })
  );

  return {
    AccountType,
    UserType,
    UserRoleEnumType,
    LoginInputType,
    RegisterInputType,

    loginMutation,
    registerMutation,
    logoutMutation,

    meQuery,
    usersQuery,
  };
}