import Document, { DocumentContext } from 'next/document';
import { prepareDocumentContext } from 'next-page-layout';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    await prepareDocumentContext(ctx);
    return Document.getInitialProps(ctx);
  }
}

export default MyDocument;
