import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";
import DocumentEditorClient from "@/components/business/templates/DocumentEditorClient";
import {
  getTemplateDefinition,
  templateDefinitions,
} from "@/lib/business/templates/templateDefinitions";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return templateDefinitions.map((template) => ({
    slug: template.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = getTemplateDefinition(slug);

  if (!template) {
    return {
      title: "Document Not Found",
    };
  }

  return {
    title: `${template.title} | Beacon Documents`,
    description: template.description,
    alternates: {
      canonical: `/business/templates/${template.slug}`,
    },
  };
}

export default async function TemplateEditorPage({ params }: PageProps) {
  const { slug } = await params;
  const template = getTemplateDefinition(slug);

  if (!template) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <DocumentEditorClient templateSlug={template.slug} />
      <BeaconFooter />
    </main>
  );
}