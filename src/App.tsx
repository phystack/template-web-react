import { useEffect, useState } from "react";
import styled from "styled-components";
import {
  connectPhyClient,
  readWebSessionCodeFromLocation,
  type PhyHubClient,
  type WebAppSessionError,
} from "@phystack/hub-client";
import logo from "./phystack-logo.svg";
import { loadBoot } from "./boot";
import type { Settings } from "./schema";

interface AppState {
  client: PhyHubClient | null;
  settings: Settings | null;
  error: Error | null;
  terminated: WebAppSessionError | null;
  isLoading: boolean;
}

function App() {
  const [state, setState] = useState<AppState>({
    client: null,
    settings: null,
    error: null,
    terminated: null,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;
    let detachTerminated: (() => void) | undefined;

    const initialize = async () => {
      try {
        // The one-time claim code arrives in the URL fragment (`#code=…`),
        // minted by the platform and delivered via QR / link. Without it
        // there is no session to establish.
        const code = readWebSessionCodeFromLocation();
        if (!code) {
          throw new Error(
            "No session code in the URL — open this app via its QR code or session link."
          );
        }

        const boot = await loadBoot();
        const client = await connectPhyClient({
          webApp: {
            urlId: boot.urlId,
            sessionBaseUrl: boot.sessionBaseUrl,
            phyhubUrl: boot.phyhubUrl,
            code,
          },
        });

        detachTerminated = client.onWebAppSessionTerminated((sessionError) => {
          if (!cancelled) {
            setState((prev) => ({ ...prev, terminated: sessionError }));
          }
        });

        // Resolved settings (device-level override > space-level override >
        // installation settings) come from the endpoint's Web twin.
        const settings = (await client.getSettings()) as Settings;

        if (!cancelled) {
          setState({
            client,
            settings,
            error: null,
            terminated: null,
            isLoading: false,
          });
        }
      } catch (err) {
        console.error("Error initializing app:", err);
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            error:
              err instanceof Error ? err : new Error("Failed to initialize"),
            isLoading: false,
          }));
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
      detachTerminated?.();
    };
  }, []);

  if (state.terminated) {
    return (
      <Container>
        <ErrorMessage>
          <ErrorTitle>Session ended</ErrorTitle>
          <ErrorDetails>
            {state.terminated.message} — scan the QR code again to start a new
            session.
          </ErrorDetails>
        </ErrorMessage>
      </Container>
    );
  }

  if (state.error) {
    return (
      <Container>
        <ErrorMessage>
          <ErrorTitle>Failed to load</ErrorTitle>
          <ErrorDetails>{state.error.message}</ErrorDetails>
        </ErrorMessage>
      </Container>
    );
  }

  if (state.isLoading || !state.settings) {
    return <Container>Connecting web session…</Container>;
  }

  const { productName, productPrice } = state.settings;

  return (
    <Container>
      <ProductInfo>
        <Logo src={logo} alt="Phystack" />
        <Title>Phystack Web App</Title>
        <SettingsDisplay>
          <SettingItem>
            <Label>Product name:</Label>
            <Value>{productName}</Value>
          </SettingItem>
          <SettingItem>
            <Label>Product price:</Label>
            <Value>{productPrice}</Value>
          </SettingItem>
        </SettingsDisplay>
      </ProductInfo>
    </Container>
  );
}

const Container = styled.div`
  text-align: center;
  background-color: #000000;
  min-height: 100%;
  position: absolute;
  display: flex;
  flex-direction: column;
  width: 100%;
  color: white;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 1.5vmin);
`;

const ProductInfo = styled.header`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 24px;
  align-items: center;
  justify-content: center;
`;

const Logo = styled.img`
  width: 40%;
  max-width: 240px;
  height: auto;
  margin-bottom: 2rem;
  pointer-events: none;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 300;
  margin: 0 0 2.5rem 0;
  color: #fff;
`;

const SettingsDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 600px;
  width: 100%;
`;

const SettingItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.div`
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.7;
`;

const Value = styled.div`
  font-size: 1.5rem;
  font-weight: 500;
`;

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  max-width: 500px;
`;

const ErrorTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 500;
  color: #ff6b6b;
  margin: 0;
`;

const ErrorDetails = styled.p`
  font-size: 1rem;
  opacity: 0.8;
  margin: 0;
`;

export default App;
