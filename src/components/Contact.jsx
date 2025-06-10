import { useForm } from 'react-hook-form';
import { useState } from 'react';

function Contact() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();
  const [status, setStatus] = useState(null);

  const onSubmit = async (data) => {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setStatus('success');
        reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="bg-gray-50 py-20 px-6">
      <div className="max-w-md mx-auto">
        <h2 className="text-4xl font-bold text-gray-800 mb-6 text-center">
          Get in Touch
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            className="w-full border p-2 rounded"
            placeholder="Name"
            {...register('name', { required: true })}
          />
          {errors.name && (
            <p className="text-red-600 text-sm">Name is required</p>
          )}
          <input
            className="w-full border p-2 rounded"
            placeholder="Email"
            {...register('email', {
              required: true,
              pattern: /^\S+@\S+$/i,
            })}
          />
          {errors.email && (
            <p className="text-red-600 text-sm">Valid email required</p>
          )}
          <textarea
            className="w-full border p-2 rounded h-32"
            placeholder="Message"
            {...register('message', { required: true })}
          />
          {errors.message && (
            <p className="text-red-600 text-sm">Message is required</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
        {status === 'success' && (
          <p className="text-green-600 mt-4 text-center">Message sent!</p>
        )}
        {status === 'error' && (
          <p className="text-red-600 mt-4 text-center">
            Something went wrong.
          </p>
        )}
      </div>
    </section>
  );
}

export default Contact;
