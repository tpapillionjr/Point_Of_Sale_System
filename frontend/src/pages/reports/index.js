export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/reports/revenue",
      permanent: false,
    },
  };
}

export default function ReportsHomePage() {
  return null;
}
