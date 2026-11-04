const features = [
  {
    icon: "📋",
    title: "AI Repository Overview",
    description:
      "Get a clear summary of your GitHub repository and understand its purpose.",
  },
  {
    icon: "⚙️",
    title: "Technology Detection",
    description:
      "Discover the programming languages, frameworks and tools used in your project.",
  },
  {
    icon: "✨",
    title: "Key Features",
    description:
      "Explore the important features and functionalities of the repository.",
  },
  {
    icon: "📦",
    title: "Prerequisites",
    description:
      "Understand the requirements and dependencies needed to run the project.",
  },
  {
    icon: "📊",
    title: "Technical Summary",
    description:
      "Explore the project structure and understand its technical details.",
  },
  {
    icon: "🔄",
    title: "Repository Insights",
    description:
      "Understand repository metadata and technical characteristics.",
  },
];

function Features() {
  return (
    <section className="min-h-screen bg-gray-50 px-6 py-20 md:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Powerful Features
          </h1>

          <p className="mt-4 text-gray-500">
            Everything you need to understand a GitHub repository.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-4xl">{feature.icon}</div>

              <h2 className="mt-5 text-xl font-semibold text-gray-900">
                {feature.title}
              </h2>

              <p className="mt-3 leading-7 text-gray-500">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;