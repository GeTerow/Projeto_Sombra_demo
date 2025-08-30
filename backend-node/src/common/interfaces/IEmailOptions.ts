export interface IEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments: {
    filename: string;
    path: string;
    contentType: 'application/pdf';
  }[];
}