import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">📚 Tutoring Platform</h3>
            <p className="text-gray-300">
              Connect with expert tutors and mentors to achieve your learning goals.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a href="#" className="hover:text-white">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <p className="text-gray-300">
              Email: support@tutoring.com
              <br />
              Phone: +1 (555) 123-4567
            </p>
          </div>
        </div>

        <hr className="border-gray-700 my-8" />

        <div className="text-center text-gray-300">
          <p>&copy; 2025 Tutoring Platform. All rights reserved.</p>
          <p className="mt-2">Team: Myself, Darkhan, Alimkhan</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;