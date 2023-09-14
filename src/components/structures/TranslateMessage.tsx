/*
Copyright 2023 Allan Tinashe Muzeya <allan.muzeya@ceo-vision.com>
Copyright 2015, 2016, 2019, 2023 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from "react";
import { MatrixEvent } from "matrix-js-sdk/src/models/event";
import BaseDialog from "../views/dialogs/BaseDialog";
import CopyableText from "../views/elements/CopyableText";
import axios from "axios";

import {_t, getCurrentLanguage} from "../../languageHandler";


interface IProps {
    mxEvent: MatrixEvent; // the MatrixEvent associated with the context menu
    ignoreEdits?: boolean;
    onFinished(): void;
}

interface IState {
    isEditing: boolean;
    translatedText: string;
    originalMessage: string;
    targetLanguage: string;
}

export default class TranslateMessage extends React.Component<IProps, IState> {
    public constructor(props: IProps) {
        super(props);

        this.state = {
            isEditing: false,
            translatedText: '',
            originalMessage: '',
            targetLanguage: getCurrentLanguage()
        };

        this.onTranslate()

    }


    private onTranslate =  () => {
        const mxEvent = this.props.mxEvent; // show the replacing event, not the original, if it is an edit

        let originalMessage = this.state.originalMessage
        // @ts-ignore
        if(mxEvent.clearEvent === undefined){
            originalMessage = mxEvent.event.content.body
        }
        // @ts-ignore
        else if (mxEvent?.clearEvent?.hasOwnProperty('content') &&
        // @ts-ignore
            mxEvent?.clearEvent?.content.msgtype === 'm.text'){
        // @ts-ignore
            originalMessage = mxEvent?.clearEvent?.content.body;
        }

         this.translateText(originalMessage).then((text)=>{
          this.setState({ originalMessage:originalMessage});
          this.setState({ translatedText:text});
      })
    }

    private translateText = async (text: string):
        Promise<string> => {
        const apiKey = 'a4676ced-a6eb-f7ed-70ff-dea518b6845e:fx';
        const url = 'https://api-free.deepl.com/v2/translate';
        const params = {
            auth_key: apiKey,
            text: text,
            target_lang: this.state.targetLanguage,
        };

        try {
            const response = await axios.post(url, null, { params });
            // Access the translated text from the response
            const translatedText = response.data.translations[0].text;
            console.log('Translated Text:', translatedText);
            this.setState({ translatedText:translatedText});
            return translatedText;
        } catch (error) {
            console.error('Error:', error.message);
        }
    };

    private onChange =  (event: React.ChangeEvent<HTMLSelectElement>): void => {
        const selectedLanguage = event.target.value;
        this.setState({ targetLanguage: selectedLanguage }, () => {
            this.onTranslate()
        });
    }
    public render(): React.ReactNode {

        let translatedText = this.state.translatedText;
        let originalMessage = this.state.originalMessage;

        return (
            <BaseDialog className="mx_ViewSource" onFinished={this.props.onFinished} title={_t("Gofast Message Translator")}>
                <div className="mx_ViewSource_header">

                    <CopyableText getTextToCopy={() => originalMessage } border={false}>
                         { originalMessage }
                    </CopyableText>

                    <div className={""}>
                        <h3>{_t('Choose a target language')}</h3>

                        <div className="">

                            <select
                                value={this.state.targetLanguage}
                                    onChange={this.onChange}>
                                <option value="">{_t("Select a language")}</option>
                                <option value="EN">{_t("English")}</option>
                                <option value="FR">{_t("Français")}</option>
                                <option value="DE">{_t("Deutsch")}</option>
                                <option value="ES">{_t("Spanish")}</option>
                                <option value="IT">{_t("Italian")}</option>
                                <option value="NL">{_t("Dutch")}</option>
                                <option value="PT">{_t("Portuguese")}</option>
                                <option value="RU">{_t("Russian")}</option>
                                <option value="JA">{_t("Japanese")}</option>
                                <option value="ZH">{_t("Chinese")}</option>
                                <option value="KO">{_t("Korean")}</option>
                            </select>

                        </div>
                    </div>
                    <br/>
                    <br/>

                    <CopyableText getTextToCopy={() => translatedText} border={false}>
                      { this.state.targetLanguage + ' : ' +  translatedText }
                    </CopyableText>
                </div>
            </BaseDialog>
        );
    }
}
