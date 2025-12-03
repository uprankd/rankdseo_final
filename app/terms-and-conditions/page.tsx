import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="h-10 w-10 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <span className="text-2xl font-bold">RankdSEO</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms and Conditions</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: August 19, 2022</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="mb-6">
              Please read these Terms of Use ("Terms", "Terms of Use") carefully before using the https://rankdseo.com website (the "Service") operated by Rankd SEO ("us", "we", or "our").
            </p>

            <p className="mb-6">
              Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users and others who access or use the Service.
            </p>

            <p className="mb-6">
              By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Accounts</h2>
            <p className="mb-4">
              When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
            </p>
            <p className="mb-4">
              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.
            </p>
            <p className="mb-6">
              You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Intellectual Property</h2>
            <p className="mb-6">
              The Service and its original content, features and functionality are and will remain the exclusive property of Rankd SEO and its licensors.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Links To Other Web Sites</h2>
            <p className="mb-4">
              Our Service may contain links to third-party web sites or services that are not owned or controlled by Rankd SEO.
            </p>
            <p className="mb-4">
              Rankd SEO has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. You further acknowledge and agree that Rankd SEO shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such web sites or services.
            </p>
            <p className="mb-4">
              We strongly advise you to read the terms and conditions and privacy policies of any third-party web sites or services that you visit.
            </p>
            <p className="mb-4">
              Rankd SEO assumes no responsibility for backlinks being indexed by any third party web sites or services.
            </p>
            <p className="mb-6">
              Rankd SEO assumes no responsibility for changes in search engine ranking positions due to links from other third party web sites or services.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Termination</h2>
            <p className="mb-4">
              We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            <p className="mb-4">
              All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.
            </p>
            <p className="mb-4">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            <p className="mb-4">
              Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.
            </p>
            <p className="mb-6">
              All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">No Refunds</h2>
            <p className="mb-6">
              Refunds will not be provided for any subscription. We do not provide credit, refunds, or probated billing for subscriptions that are canceled mid-month. In such circumstance, you will continue to have access to your Subscription until the end of the billing cycle. Subscription Provider reserves the right to offer refunds, discounts or other consideration in select circumstances at its sole discretion. Please note that each circumstance is unique and election to make such an offer in one instance does not create the obligation to do so in another.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Disclaimer</h2>
            <p className="mb-6">
              Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Governing Law</h2>
            <p className="mb-6">
              These Terms shall be governed and construed in accordance with the laws of Latvia without regard to its conflict of law provisions.
            </p>
            <p className="mb-6">
              Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our Service, and supersede and replace any prior agreements we might have between us regarding the Service.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Changes</h2>
            <p className="mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            <p className="mb-6">
              By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
            <p className="mb-6">
              If you have any questions about these Terms, please contact us via email{' '}
              <a href="mailto:martins@rankdseo.com" className="text-blue-600 hover:underline">
                martins@rankdseo.com
              </a>
              .
            </p>

            <div className="mt-8 pt-6 border-t">
              <Link href="/" className="text-blue-600 hover:underline">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
