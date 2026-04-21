import { randomUUID } from "node:crypto";
import path from "node:path";
import { promises as fs } from "node:fs";

import { NextRequest, NextResponse } from "next/server";
import { postData, putData, withBaseHeaders } from "@/config/http/http-service.server";
import { ADMIN_BASE_PATH, CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { OutputType } from "@/features/categories/actions/upload-category-image/types";
import { getSession } from '../../../../../lib/auth/session';


function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-]+/g, "-").toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file was provided." }, { status: 400 });
    }


    const now = new Date();

    const session = await getSession();
    const user = session?.user;

    formData.append('path', '1')

    const { data, error } =
      await putData<FormData, OutputType>(
        `File/UploadAnyFile?path=1`,
        formData,
        { locale: 'en', token: user?.accessToken }
      )





    return NextResponse.json({
      fileUrl: data,
      storedName: file.name,
    });


  } catch (error) {
    console.log('+++++++++++++++++++++++++++++++')
    console.log('+++++++++++++++++++++++++++++++')
    console.log('+++++++++++++++++++++++++++++++')
    console.log('+++++++++++++++++++++++++++++++')
    console.log('+++++++++++++++++++++++++++++++')
    console.log(error)

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to store uploaded file.",
      },
      { status: 500 }
    );
  }
}
