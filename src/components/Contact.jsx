import { useForm } from "react-hook-form";
import { useState } from "react";

function Contact() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [status, setStatus] = useState(null);

  const onSubmit = async (data) => {
    setStatus(null);
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!response.ok) throw new Error("Contact request failed");
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="pf-contact">
      <div className="pf-contact-copy">
        <span className="pf-card-label">03 / START A CONVERSATION</span>
        <h2>Have a problem<br />worth <em>building</em> for?</h2>
        <p>I&apos;m interested in software development opportunities, creative product work, and teams that care about both the system and the experience.</p>
        <div className="pf-contact-links">
          <a href="mailto:priitivi@gmail.com"><span>EMAIL</span><strong>priitivi@gmail.com</strong><i aria-hidden="true">↗</i></a>
          <a href="https://github.com/priitivi" target="_blank" rel="noreferrer"><span>GITHUB</span><strong>@priitivi</strong><i aria-hidden="true">↗</i></a>
          <a href="/Priit_CV.pdf" download><span>DOCUMENT</span><strong>Download CV</strong><i aria-hidden="true">↓</i></a>
        </div>
      </div>

      <form className="pf-contact-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="pf-form-top"><span>NEW_MESSAGE.TXT</span><small>SECURE CHANNEL / 001</small></div>
        <div className="pf-field">
          <label htmlFor="contact-name">Your name</label>
          <input id="contact-name" autoComplete="name" placeholder="How should I address you?" {...register("name", { required: "Please enter your name." })} />
          {errors.name && <p role="alert">{errors.name.message}</p>}
        </div>
        <div className="pf-field">
          <label htmlFor="contact-email">Email address</label>
          <input id="contact-email" type="email" autoComplete="email" placeholder="you@company.com" {...register("email", { required: "Please enter your email.", pattern: { value: /^\S+@\S+$/i, message: "Please enter a valid email." } })} />
          {errors.email && <p role="alert">{errors.email.message}</p>}
        </div>
        <div className="pf-field">
          <label htmlFor="contact-message">What are we building?</label>
          <textarea id="contact-message" placeholder="Tell me about the idea, role, or problem…" {...register("message", { required: "Please include a message." })} />
          {errors.message && <p role="alert">{errors.message.message}</p>}
        </div>
        <button type="submit" className="pf-submit" disabled={isSubmitting}>{isSubmitting ? "Transmitting…" : "Send the message"}<span aria-hidden="true">↗</span></button>
        {status === "success" && <p className="pf-form-status is-success" role="status">Message received. I&apos;ll be in touch.</p>}
        {status === "error" && <p className="pf-form-status is-error" role="status">The message could not be sent. Email me directly instead.</p>}
      </form>

      <footer className="pf-footer"><strong>PRIITIVI © {new Date().getFullYear()}</strong><span>Designed and built in London.</span><a href="#hero">Back to top ↑</a></footer>
    </section>
  );
}

export default Contact;
