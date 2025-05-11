function Contact() {
  return (
    <section id="contact" className="bg-gray-50 py-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Let’s Get in Touch</h2>
        <p className="text-gray-600 mb-8">
          Feel free to reach out for collaborations, freelance work, or just to say hi!
        </p>

        <div className="flex flex-col items-center space-y-4">
          <a
            href="mailto:priitivi@gmail.com"
            className="text-blue-600 font-medium text-lg hover:underline"
          >
            📬 priitivi@gmail.com
          </a>

          <div className="flex space-x-6 mt-4">
            <a
              href="https://github.com/priitivi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-blue-600 text-xl"
            >
              GitHub
            </a>

            <a
              href="https://www.linkedin.com/in/priitivi-ravi-8b47651b4/" // update this later
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-blue-600 text-xl"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
