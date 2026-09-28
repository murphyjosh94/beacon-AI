import { createClient } from "@supabase/supabase-js";

import { NextRequest, NextResponse } from "next/server";



import {

  getAccessErrorStatus,

  requireAdministratorAccount,

} from "@/lib/auth/AdminAccess";



export const runtime = "nodejs";

export const dynamic = "force-dynamic";



const RESEND_API_URL = "https://api.resend.com/emails";



const SUPPORT_EMAIL_FROM =

  "Save Woolton Baths <savewooltonbaths@futureofwoolton.org.uk>";



const SUPPORT_EMAIL_REPLY_TO =

  "savewooltonbaths@gmail.com";



const SUPPORT_EMAIL_ADDRESS =

  "savewooltonbaths@futureofwoolton.org.uk";



const CAMPAIGN_URL =

  "https://beacon-ai.co.uk/savewooltonbaths";



const CAMPAIGN_LOGO_URL =

  "https://beacon-ai.co.uk/savewooltonbaths/logo.png";



const MAX_SUBJECT_LENGTH = 180;

const MAX_MESSAGE_LENGTH = 10000;



type ReplyRequestBody = {

  registrationId?: unknown;

  subject?: unknown;

  message?: unknown;

};



type SupporterRow = {

  id: string;

  name: string;

  email: string;

  permission_to_contact: boolean;

};



type ResendResponse = {

  id?: string;

};


