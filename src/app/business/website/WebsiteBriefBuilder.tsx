"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type PackageId = "starter" | "business" | "premium";

type BriefData = {
  businessName: string;
  businessType: string;
  businessDescription: string;
  yearsTrading: string;
  serviceArea: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  primaryColour: string;
  secondaryColour: string;
  styleDirection: string;
  services: string;
  idealCustomer: string;
  keyMessage: string;
  callToAction: string;
  socialLinks: string;
  packageId: PackageId;
  chatbot: boolean;
  onlineShop: boolean;
  membershipArea: boolean;
  notes: string;
};

type FieldErrors = Partial<Record<keyof BriefData, string>>;

const STORAGE_KEY = "beacon-business-website-brief";

const initialData: BriefData = {
  businessName: "",
  businessType: "",
  businessDescription: "",
  yearsTrading: "",
  serviceArea: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  primaryColour: "#0f3d91",
  secondaryColour: "#d4af37",
  styleDirection: "Professional and trustworthy",
  services: "",
  idealCustomer: "",
  keyMessage: "",
  callToAction: "Request a quote",
  socialLinks: "",
  packageId: "business",
  chatbot: false,
  onlineShop: false,
  membershipArea: false,
  notes: "",
};

const packages = {
  starter: {
    name: "Starter Website",
    price: 150,
    description: "A professional foundation for new and local businesses.",
  },
  business: {
    name: "Business Website",
    price: 350,
    description: "A stronger website for established businesses ready to grow.",
  },
  premium: {
    name: "Premium Website",
    price: 600,
    description:
      "An advanced website with bespoke functionality and integrations.",
  },
} satisfies Record<
  PackageId,
  {
    name: string;
    price: number;
    description: string;
  }
>;

const steps = [
  "Business",
  "Contact",
  "Design",
  "Content",
  "Package",
  "Review",
];

const modules = [
  {
    key: "chatbot" as const,
    name: "AI Chatbot",
    price: 50,
    description:
      "Add a helpful website assistant for common questions and enquiries.",
  },
  {
    key: "onlineShop" as const,
    name: "Online Shop",
    price: 50,
    description: "Add a simple product catalogue and online selling capability.",
  },
  {
    key: "membershipArea" as const,
    name: "Membership Area",
    price: 37.5,
    description:
      "Add protected content or account access for registered members.",
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

function TextInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  error,
}: {
  id: keyof BriefData;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="font-extrabold text-slate-900">
        {label}
        {required ? <span className="text-blue-900"> *</span> : null}
      </span>

      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
            : "border-slate-300 focus:border-blue-700 focus:ring-blue-100"
        }`}
      />

      {error ? (
        <span
          id={`${id}-error`}
          className="mt-2 block text-sm font-semibold text-rose-700"
        >
          {error}
        </span>
      ) : null}
    </label>
  );
}

function TextArea({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 5,
  error,
}: {
  id: keyof BriefData;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="font-extrabold text-slate-900">
        {label}
        {required ? <span className="text-blue-900"> *</span> : null}
      </span>

      <textarea
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-2 w-full resize-y rounded-2xl border bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
            : "border-slate-300 focus:border-blue-700 focus:ring-blue-100"
        }`}
      />

      {error ? (
        <span
          id={`${id}-error`}
          className="mt-2 block text-sm font-semibold text-rose-700"
        >
          {error}
        </span>
      ) : null}
    </label>
  );
}

export default function WebsiteBriefBuilder() {
  const [data, setData] = useState<BriefData>(initialData);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const savedBrief = window.localStorage.getItem(STORAGE_KEY);

    if (!savedBrief) {
      return;
    }

    try {
      const parsed = JSON.parse(savedBrief) as Partial<BriefData>;
      setData((current) => ({
        ...current,
        ...parsed,
      }));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSaved(true);

    const timer = window.setTimeout(() => {
      setSaved(false);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [data]);

  const total = useMemo(() => {
    const packagePrice = packages[data.packageId].price;
    const modulePrice = modules.reduce((sum, module) => {
      return data[module.key] ? sum + module.price : sum;
    }, 0);

    return packagePrice + modulePrice;
  }, [data]);

  const handleTextChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    setData((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: undefined,
    }));
  };

  const validateStep = (currentStep: number) => {
    const nextErrors: FieldErrors = {};

    if (currentStep === 0) {
      if (!data.businessName.trim()) {
        nextErrors.businessName = "Enter your business name.";
      }

      if (!data.businessType.trim()) {
        nextErrors.businessType = "Enter the type of business.";
      }

      if (!data.businessDescription.trim()) {
        nextErrors.businessDescription =
          "Describe what your business does.";
      }
    }

    if (currentStep === 1) {
      if (!data.serviceArea.trim()) {
        nextErrors.serviceArea = "Enter the area your business serves.";
      }

      if (!data.email.trim()) {
        nextErrors.email = "Enter a contact email address.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        nextErrors.email = "Enter a valid email address.";
      }

      if (!data.phone.trim()) {
        nextErrors.phone = "Enter a contact telephone number.";
      }
    }

    if (currentStep === 3) {
      if (!data.services.trim()) {
        nextErrors.services = "List the main services you want to promote.";
      }

      if (!data.keyMessage.trim()) {
        nextErrors.keyMessage =
          "Enter the main message visitors should remember.";
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) {
      return;
    }

    setStep((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const goBack = () => {
    setStep((current) => Math.max(current - 1, 0));
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSubmitted(true);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...data,
        submittedAt: new Date().toISOString(),
      })
    );
  };

  const resetBrief = () => {
    setData(initialData);
    setStep(0);
    setErrors({});
    setSubmitted(false);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  if (submitted) {
    return (
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-emerald-200 bg-white p-8 text-center shadow-2xl sm:p-12">
          <span
            aria-hidden="true"
            className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-3xl font-black text-white"
          >
            ✓
          </span>

          <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.3em] text-emerald-700">
            Website Brief Complete
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Your business information is ready for preview creation.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Your completed brief has been saved securely on this device. The
            next build stage will connect this brief to your Beacon account and
            generate the interactive website preview.
          </p>

          <div className="mx-auto mt-8 max-w-xl rounded-3xl bg-slate-50 p-6 text-left">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <span className="font-bold text-slate-600">Business</span>
              <span className="font-black text-slate-950">
                {data.businessName}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-4">
              <span className="font-bold text-slate-600">Package</span>
              <span className="font-black text-slate-950">
                {packages[data.packageId].name}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4">
              <span className="font-bold text-slate-600">
                Estimated configuration
              </span>
              <span className="text-2xl font-black text-blue-950">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <p className="mt-6 text-sm leading-6 text-slate-500">
            No payment has been taken. Final scope and price are confirmed
            before an order is placed.
          </p>

          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-8 rounded-2xl bg-blue-950 px-7 py-4 font-extrabold text-white transition hover:bg-blue-900"
          >
            Return to my brief
          </button>

          <button
            type="button"
            onClick={resetBrief}
            className="ml-0 mt-4 rounded-2xl border border-slate-300 px-7 py-4 font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-950 sm:ml-3"
          >
            Start a new brief
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex min-w-max items-center gap-3">
            {steps.map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (index <= step) {
                    setStep(index);
                  }
                }}
                disabled={index > step}
                className={`flex items-center gap-3 rounded-full px-4 py-2 text-sm font-extrabold transition ${
                  index === step
                    ? "bg-blue-950 text-white"
                    : index < step
                      ? "bg-blue-100 text-blue-950 hover:bg-blue-200"
                      : "cursor-not-allowed bg-slate-200 text-slate-500"
                }`}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                    index < step
                      ? "bg-blue-950 text-white"
                      : index === step
                        ? "bg-white text-blue-950"
                        : "bg-slate-300 text-slate-500"
                  }`}
                >
                  {index < step ? "✓" : index + 1}
                </span>

                {item}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8 lg:p-10">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-blue-900">
                    Step {step + 1} of {steps.length}
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                    {steps[step]}
                  </h2>
                </div>

                <span className="text-sm font-bold text-emerald-700">
                  {saved ? "Draft saved" : "Saved locally"}
                </span>
              </div>

              {step === 0 ? (
                <div className="grid gap-6">
                  <TextInput
                    id="businessName"
                    label="Business name"
                    value={data.businessName}
                    onChange={handleTextChange}
                    placeholder="Example: Murphy Property Services"
                    required
                    error={errors.businessName}
                  />

                  <TextInput
                    id="businessType"
                    label="Type of business"
                    value={data.businessType}
                    onChange={handleTextChange}
                    placeholder="Example: Plastering and property maintenance"
                    required
                    error={errors.businessType}
                  />

                  <TextArea
                    id="businessDescription"
                    label="What does your business do?"
                    value={data.businessDescription}
                    onChange={handleTextChange}
                    placeholder="Describe your business, the work you complete and what makes your service different."
                    required
                    error={errors.businessDescription}
                  />

                  <TextInput
                    id="yearsTrading"
                    label="How long have you been trading?"
                    value={data.yearsTrading}
                    onChange={handleTextChange}
                    placeholder="Example: 8 years"
                  />
                </div>
              ) : null}

              {step === 1 ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <TextInput
                      id="serviceArea"
                      label="Area you serve"
                      value={data.serviceArea}
                      onChange={handleTextChange}
                      placeholder="Example: Liverpool and surrounding areas"
                      required
                      error={errors.serviceArea}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <TextInput
                      id="address"
                      label="Business address"
                      value={data.address}
                      onChange={handleTextChange}
                      placeholder="Optional if you work from home"
                    />
                  </div>

                  <TextInput
                    id="phone"
                    label="Telephone"
                    value={data.phone}
                    onChange={handleTextChange}
                    type="tel"
                    placeholder="Business contact number"
                    required
                    error={errors.phone}
                  />

                  <TextInput
                    id="email"
                    label="Email"
                    value={data.email}
                    onChange={handleTextChange}
                    type="email"
                    placeholder="contact@example.co.uk"
                    required
                    error={errors.email}
                  />

                  <div className="sm:col-span-2">
                    <TextInput
                      id="website"
                      label="Existing website"
                      value={data.website}
                      onChange={handleTextChange}
                      type="url"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid gap-7">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <label className="block">
                      <span className="font-extrabold text-slate-900">
                        Primary colour
                      </span>

                      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-300 bg-white p-3">
                        <input
                          type="color"
                          name="primaryColour"
                          value={data.primaryColour}
                          onChange={handleTextChange}
                          className="h-12 w-16 cursor-pointer rounded-xl border-0 bg-transparent"
                        />

                        <span className="font-mono text-sm font-bold text-slate-700">
                          {data.primaryColour}
                        </span>
                      </div>
                    </label>

                    <label className="block">
                      <span className="font-extrabold text-slate-900">
                        Secondary colour
                      </span>

                      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-300 bg-white p-3">
                        <input
                          type="color"
                          name="secondaryColour"
                          value={data.secondaryColour}
                          onChange={handleTextChange}
                          className="h-12 w-16 cursor-pointer rounded-xl border-0 bg-transparent"
                        />

                        <span className="font-mono text-sm font-bold text-slate-700">
                          {data.secondaryColour}
                        </span>
                      </div>
                    </label>
                  </div>

                  <label className="block">
                    <span className="font-extrabold text-slate-900">
                      Preferred design style
                    </span>

                    <select
                      name="styleDirection"
                      value={data.styleDirection}
                      onChange={handleTextChange}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                    >
                      <option>Professional and trustworthy</option>
                      <option>Modern and minimal</option>
                      <option>Bold and energetic</option>
                      <option>Premium and elegant</option>
                      <option>Friendly and approachable</option>
                      <option>Traditional and established</option>
                    </select>
                  </label>

                  <div
                    className="rounded-[2rem] p-6 text-white"
                    style={{
                      background: `linear-gradient(135deg, ${data.primaryColour}, ${data.secondaryColour})`,
                    }}
                  >
                    <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-white/80">
                      Colour preview
                    </p>

                    <p className="mt-3 text-3xl font-black">
                      {data.businessName || "Your Business"}
                    </p>

                    <p className="mt-2 text-white/85">
                      {data.styleDirection}
                    </p>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="grid gap-6">
                  <TextArea
                    id="services"
                    label="Main services"
                    value={data.services}
                    onChange={handleTextChange}
                    placeholder="List each service you want the website to promote."
                    required
                    error={errors.services}
                  />

                  <TextArea
                    id="idealCustomer"
                    label="Ideal customer"
                    value={data.idealCustomer}
                    onChange={handleTextChange}
                    placeholder="Describe the people or businesses you most want to attract."
                  />

                  <TextArea
                    id="keyMessage"
                    label="Main message"
                    value={data.keyMessage}
                    onChange={handleTextChange}
                    placeholder="What should visitors remember about your business?"
                    required
                    error={errors.keyMessage}
                  />

                  <TextInput
                    id="callToAction"
                    label="Main call to action"
                    value={data.callToAction}
                    onChange={handleTextChange}
                    placeholder="Example: Request a quote"
                  />

                  <TextArea
                    id="socialLinks"
                    label="Social media links"
                    value={data.socialLinks}
                    onChange={handleTextChange}
                    placeholder="Add one link per line."
                    rows={3}
                  />

                  <TextArea
                    id="notes"
                    label="Anything else we should know?"
                    value={data.notes}
                    onChange={handleTextChange}
                    placeholder="Add awards, memberships, guarantees, accreditations or other useful details."
                    rows={4}
                  />
                </div>
              ) : null}

              {step === 4 ? (
                <div>
                  <div className="grid gap-5 lg:grid-cols-3">
                    {(Object.keys(packages) as PackageId[]).map((packageId) => {
                      const item = packages[packageId];
                      const selected = data.packageId === packageId;

                      return (
                        <button
                          key={packageId}
                          type="button"
                          onClick={() =>
                            setData((current) => ({
                              ...current,
                              packageId,
                            }))
                          }
                          className={`rounded-[2rem] border p-6 text-left transition ${
                            selected
                              ? "border-blue-950 bg-blue-950 text-white shadow-xl"
                              : "border-slate-200 bg-slate-50 text-slate-950 hover:border-blue-300 hover:bg-white"
                          }`}
                        >
                          <p
                            className={`text-sm font-extrabold uppercase tracking-[0.18em] ${
                              selected ? "text-blue-200" : "text-blue-900"
                            }`}
                          >
                            {item.name}
                          </p>

                          <p className="mt-3 text-3xl font-black">
                            {packageId === "premium"
                              ? `From ${formatCurrency(item.price)}`
                              : formatCurrency(item.price)}
                          </p>

                          <p
                            className={`mt-3 text-sm leading-6 ${
                              selected ? "text-blue-100" : "text-slate-600"
                            }`}
                          >
                            {item.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-10">
                    <h3 className="text-2xl font-black tracking-tight text-slate-950">
                      Optional modules
                    </h3>

                    <p className="mt-2 leading-7 text-slate-600">
                      Choose individual features now or add them later through
                      your Beacon Business dashboard.
                    </p>

                    <div className="mt-6 grid gap-4">
                      {modules.map((module) => (
                        <label
                          key={module.key}
                          className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition ${
                            data[module.key]
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 bg-slate-50 hover:border-blue-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={data[module.key]}
                            onChange={(event) =>
                              setData((current) => ({
                                ...current,
                                [module.key]: event.target.checked,
                              }))
                            }
                            className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-900 focus:ring-blue-700"
                          />

                          <span className="flex-1">
                            <span className="flex items-center justify-between gap-4">
                              <strong className="text-slate-950">
                                {module.name}
                              </strong>

                              <span className="font-black text-blue-950">
                                {formatCurrency(module.price)}
                              </span>
                            </span>

                            <span className="mt-2 block text-sm leading-6 text-slate-600">
                              {module.description}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>

                    <p className="mt-5 rounded-2xl bg-amber-50 px-5 py-4 text-sm font-semibold leading-6 text-amber-900">
                      Individual modules offer flexibility. When several
                      modules are selected, a full package upgrade may provide
                      better value.
                    </p>
                  </div>
                </div>
              ) : null}

              {step === 5 ? (
                <div className="space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                      Business
                    </p>

                    <h3 className="mt-3 text-2xl font-black text-slate-950">
                      {data.businessName}
                    </h3>

                    <p className="mt-2 text-slate-600">
                      {data.businessType}
                    </p>

                    <p className="mt-4 leading-7 text-slate-700">
                      {data.businessDescription}
                    </p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6">
                      <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                        Contact
                      </p>

                      <dl className="mt-4 space-y-3 text-sm">
                        <div>
                          <dt className="font-bold text-slate-500">Area</dt>
                          <dd className="font-semibold text-slate-900">
                            {data.serviceArea}
                          </dd>
                        </div>

                        <div>
                          <dt className="font-bold text-slate-500">Phone</dt>
                          <dd className="font-semibold text-slate-900">
                            {data.phone}
                          </dd>
                        </div>

                        <div>
                          <dt className="font-bold text-slate-500">Email</dt>
                          <dd className="break-all font-semibold text-slate-900">
                            {data.email}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6">
                      <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                        Design
                      </p>

                      <div className="mt-4 flex gap-3">
                        <span
                          className="h-12 w-12 rounded-2xl border border-slate-200"
                          style={{ backgroundColor: data.primaryColour }}
                          title={data.primaryColour}
                        />

                        <span
                          className="h-12 w-12 rounded-2xl border border-slate-200"
                          style={{ backgroundColor: data.secondaryColour }}
                          title={data.secondaryColour}
                        />
                      </div>

                      <p className="mt-4 font-semibold text-slate-900">
                        {data.styleDirection}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                      Package and modules
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-black text-slate-950">
                          {packages[data.packageId].name}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {packages[data.packageId].description}
                        </p>
                      </div>

                      <p className="text-2xl font-black text-blue-950">
                        {formatCurrency(packages[data.packageId].price)}
                      </p>
                    </div>

                    <div className="mt-5 space-y-3">
                      {modules
                        .filter((module) => data[module.key])
                        .map((module) => (
                          <div
                            key={module.key}
                            className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
                          >
                            <span className="font-bold text-slate-700">
                              {module.name}
                            </span>

                            <span className="font-black text-slate-950">
                              {formatCurrency(module.price)}
                            </span>
                          </div>
                        ))}

                      {!modules.some((module) => data[module.key]) ? (
                        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                          No optional modules selected.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-blue-950 p-6 text-white">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-extrabold">
                        Estimated configuration
                      </span>

                      <span className="text-3xl font-black">
                        {formatCurrency(total)}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-blue-200">
                      No payment is taken when you complete this brief. Final
                      scope and pricing are confirmed before an order is placed.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === 0}
                  className="rounded-2xl border border-slate-300 px-6 py-3 font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Back
                </button>

                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="rounded-2xl bg-blue-950 px-7 py-3 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-900"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="rounded-2xl bg-emerald-600 px-7 py-3 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-700"
                  >
                    Complete website brief
                  </button>
                )}
              </div>
            </div>

            <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl lg:sticky lg:top-6">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-900">
                Your Website
              </p>

              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                {data.businessName || "New business website"}
              </h3>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-500">
                  Selected package
                </p>

                <p className="mt-1 font-black text-slate-950">
                  {packages[data.packageId].name}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {modules.map((module) => (
                  <div
                    key={module.key}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="font-semibold text-slate-600">
                      {module.name}
                    </span>

                    <span
                      className={`font-black ${
                        data[module.key]
                          ? "text-emerald-700"
                          : "text-slate-400"
                      }`}
                    >
                      {data[module.key] ? "Added" : "Not added"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-extrabold text-slate-700">
                    Estimated total
                  </span>

                  <span className="text-2xl font-black text-blue-950">
                    {formatCurrency(total)}
                  </span>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Premium websites start from £600. Bespoke work is confirmed
                  after the brief is reviewed.
                </p>
              </div>

              <div className="mt-6 rounded-2xl bg-blue-50 px-4 py-4 text-sm font-semibold leading-6 text-blue-950">
                Your progress is saved automatically on this device.
              </div>
            </aside>
          </div>
        </form>
      </div>
    </section>
  );
}