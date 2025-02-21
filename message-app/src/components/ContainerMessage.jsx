import ContainerMessageText from './ContainerMessageText';
import ContainerMessageHeader from './ContainerMessageHeader';

function ContainerMessage() {
  return(
    <section className="flex flex-col w-full h-screen">
      <ContainerMessageHeader />
      <ContainerMessageText />
    </section>
  )
}
export default ContainerMessage;