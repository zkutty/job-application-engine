import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { extractPdfText, parseProfileFromResumeText } from "@/lib/profile/importResume";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing PDF file upload." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawResumeText = await extractPdfText(Buffer.from(arrayBuffer));

    if (rawResumeText.length < 40) {
      return NextResponse.json({ error: "Could not extract enough text from PDF." }, { status: 422 });
    }

    const parsedProfile = await parseProfileFromResumeText(rawResumeText);

    const existing = await prisma.candidateProfile.findFirst({ orderBy: { id: "asc" } });

    const savedProfile = existing
      ? await prisma.candidateProfile.update({
          where: { id: existing.id },
          data: {
            name: parsedProfile.name,
            headline: parsedProfile.headline,
            summary: parsedProfile.summary,
            skillsJson: JSON.stringify(parsedProfile.skills),
            voiceGuidelines: parsedProfile.voiceGuidelines,
            profileJson: JSON.stringify(parsedProfile),
            rawResumeText,
          },
        })
      : await prisma.candidateProfile.create({
          data: {
            name: parsedProfile.name,
            headline: parsedProfile.headline,
            summary: parsedProfile.summary,
            skillsJson: JSON.stringify(parsedProfile.skills),
            voiceGuidelines: parsedProfile.voiceGuidelines,
            profileJson: JSON.stringify(parsedProfile),
            rawResumeText,
          },
        });

    return NextResponse.json(
      {
        parsedProfile,
        rawResumeText,
        profileId: savedProfile.id,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to import resume profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
