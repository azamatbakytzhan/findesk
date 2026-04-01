import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      organizationId: string;
      orgName: string;
      role: string;
    };
  }
}
